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

        // Clone to prevent submitted entries with another status that #open
        let post: BlogPost = cloneToStatus(blogPost, #open);

        feedStore.put(toKey(post.storageId, post.id), post);
    };

    private func validSecret(requestSecret: Text): Bool {
        requestSecret == secret;
    };

    private func toKey(storageId: Principal, id: Text): Text {
        Principal.toText(storageId) # "-" # id
    };

    private func cloneToStatus(blogPost: BlogPost, status: BlogPostStatus): BlogPost {
        {
            id = blogPost.id;
            fullPath = blogPost.fullPath;
            meta = blogPost.meta;
            storageId = blogPost.storageId;
            status;
            created_at = blogPost.created_at;
            updated_at = blogPost.updated_at;
        };
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

    private func updateStatus(caller: Principal, storageId: Principal, id: Text, status: BlogPostStatus) : async () {
        if (not Utils.isAdmin(caller)) {
            throw Error.reject("Unauthorized access. Caller is not an admin." # Principal.toText(caller));
        };

        let key: Text = toKey(storageId, id);
        let post: ?BlogPost = feedStore.get(toKey(storageId, id));

        switch (post) {
            case (?post) {
                let acceptedPost: BlogPost = cloneToStatus(post, status);
                feedStore.put(key, acceptedPost);
            };
            case (null) {};
        };
    };

    system func preupgrade() {
        entries := Iter.toArray(feedStore.preupgrade().entries());
    };

    system func postupgrade() {
        feedStore.postupgrade(entries);
        entries := [];
    };
}