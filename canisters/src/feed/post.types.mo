import Text "mo:base/Text";
import Time "mo:base/Time";
import Blob "mo:base/Blob";

import IC "../types/ic.types";

import ProposalTypes "./proposal.types";

module {

  type Proposal = ProposalTypes.Proposal;

  public type Post = Proposal and {
    created_at : Time.Time;
    updated_at : Time.Time;
  };

};
