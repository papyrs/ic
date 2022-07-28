import Text "mo:base/Text";
import Error "mo:base/Error";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Result "mo:base/Result";

import PostFilter "./post.filter";
import PostStore "./post.store";
import PostTypes "./post.types";

import ProposalFilter "./proposal.filter";
import ProposalStore "./proposal.store";
import ProposalTypes "./proposal.types";

import Utils "../utils/utils";

actor class Feed(secret: Text) {

    type Post = PostTypes.Post;
    type PostFilter = PostFilter.PostFilter;

    type Proposal = ProposalTypes.Proposal;
    type ProposalEntry = ProposalTypes.ProposalEntry;
    type ProposalFilter = ProposalFilter.ProposalFilter;
    type ProposalStatus = ProposalTypes.ProposalStatus;

    let postStore: PostStore.PostStore = PostStore.PostStore();
    let proposalStore: ProposalStore.ProposalStore = ProposalStore.ProposalStore();

    /**
     * The caller should know the pseudo secret (to try to limit spam proposal) to submit a blog post.
    */
    public shared({ caller }) func submit(secret: Text, proposal: Proposal) : async () {
        if (not validSecret(secret)) {
            throw Error.reject("Caller does not have the permission to submit a blog post.");
        };

        proposalStore.submit(proposal);
    };

    public shared query func list(filter: ?PostFilter) : async [(Text, Post)] {
        return postStore.entries(filter);
    };

    private func validSecret(requestSecret: Text): Bool {
        requestSecret == secret;
    };

    /**
     * Admin: restricted for admin
     */

    public shared query({ caller }) func listProposals(filter: ?ProposalFilter) : async [(Text, ProposalEntry)] {
        if (not Utils.isAdmin(caller)) {
            throw Error.reject("Unauthorized access. Caller is not an admin. " # Principal.toText(caller));
        };

        return proposalStore.entries(filter);
    };

    public shared({ caller }) func accept(storageId: Principal, id: Text) : async () {
        await updateStatus(caller, storageId, id, #accepted);

        let entry: ?ProposalEntry = proposalStore.get(storageId, id);

        switch (entry) {
            case (?entry) {
                postStore.add(entry.proposal);
            };
            case (null) {
                throw Error.reject("The proposal was accepted but the post was not added to the list.");
            };
        };
    };

    public shared({ caller }) func decline(storageId: Principal, id: Text) : async () {
        await updateStatus(caller, storageId, id, #declined);
    };

    private func updateStatus(caller: Principal, storageId: Principal, id: Text, status: ProposalStatus): async () {
        if (not Utils.isAdmin(caller)) {
            throw Error.reject("Unauthorized access. Caller is not an admin. " # Principal.toText(caller));
        };

        let result: Result.Result<Text, Text> = proposalStore.updateStatus(storageId, id, status);

        switch (result) {
            case (#err error) {
                throw Error.reject(error);
            };
            case (#ok bucket) {};
        };
    };

    /**
     * e.g. delete to correct a declined proposal that has been wrongly added to the list of posts.
     * Can happens if the wrong command line is executed 🤦.
    */
    public shared({ caller }) func del(storageId: Principal, id: Text) : async () {
        if (not Utils.isAdmin(caller)) {
            throw Error.reject("Unauthorized access. Caller is not an admin. " # Principal.toText(caller));
        };

        let entry: ?Post = postStore.del(storageId, id);
    };

    /**
     * Preserve the application state on upgrades
     */
    private stable var postEntries : [(Text, Post)] = [];
    private stable var proposalEntries : [(Text, ProposalEntry)] = [];

    system func preupgrade() {
        postEntries := Iter.toArray(postStore.preupgrade().entries());
        proposalEntries := Iter.toArray(proposalStore.preupgrade().entries());
    };

    system func postupgrade() {
        postStore.postupgrade(postEntries);
        postEntries := [];

        proposalStore.postupgrade(proposalEntries);
        proposalEntries := [];
    };
}
