import Text "mo:base/Text";
import Error "mo:base/Error";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";

import Filter "./feed.filter";
import FeedStore "./feed.store";
import FeedTypes "./feed.types";

import Utils "../utils/utils";

actor class Feed(secret: Text) {

    type FeedFilter = Filter.FeedFilter;

    type BlogPostStatus = FeedTypes.BlogPostStatus;
    type BlogPost = FeedTypes.BlogPost;

    let feedStore: FeedStore.FeedStore = FeedStore.FeedStore();

    // Preserve the application state on upgrades
    private stable var entries : [(Text, BlogPost)] = [];

    /**
     * The caller should know the pseudo secret (to try to limit spam submission) to submit a blog post.
    */
    public shared({ caller }) func submit(secret: Text, blogPost: BlogPost) : async () {
        if (not validSecret(secret)) {
            throw Error.reject("Caller does not have the permission to submit a blog post.");
        };

        feedStore.submit(blogPost);
    };

    private func validSecret(requestSecret: Text): Bool {
        requestSecret == secret;
    };

    /**
     * Admin: restricted for admin
     */

    public shared query({ caller }) func list(filter: ?FeedFilter) : async [(Text, BlogPost)] {
        if (not Utils.isAdmin(caller)) {
            throw Error.reject("Unauthorized access. Caller is not an admin." # Principal.toText(caller));
        };

        return feedStore.entries(filter);
    };

    public shared({ caller }) func accept(storageId: Principal, id: Text) : async () {
        await updateStatus(caller, storageId, id, #accepted);
    };

    public shared({ caller }) func decline(storageId: Principal, id: Text) : async () {
        await updateStatus(caller, storageId, id, #declined);
    };

    private func updateStatus(caller: Principal, storageId: Principal, id: Text, status: BlogPostStatus): async () {
        if (not Utils.isAdmin(caller)) {
            throw Error.reject("Unauthorized access. Caller is not an admin." # Principal.toText(caller));
        };

        feedStore.updateStatus(storageId, id, status);
    };

    system func preupgrade() {
        entries := Iter.toArray(feedStore.preupgrade().entries());
    };

    system func postupgrade() {
        feedStore.postupgrade(entries);
        entries := [];
    };
}
