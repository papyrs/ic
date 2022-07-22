import Text "mo:base/Text";
import Time "mo:base/Time";
import Blob "mo:base/Blob";

import IC "../types/ic.types";

module {

    /**
     * Blog post status is meant to prevent SPAM and submission that does not comply with the terms of use
     */
    public type ProposalStatus = {
        #open;
        #declined;
        #accepted;
    };

    /**
     * The blog post proposal submitted by the user
     */
    public type Proposal = {
        id: Text;
        storageId: IC.canister_id;
        meta: Blob;
    };

    /**
     * The type saved in memory for the proposal
     */
    public type ProposalEntry = {
        proposal: Proposal;

        status: ProposalStatus;

        created_at: Time.Time;
        updated_at: Time.Time;
    };
}
