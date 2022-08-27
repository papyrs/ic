import Text "mo:base/Text";

import ProposalTypes "./proposal.types";

module {

  type ProposalStatus = ProposalTypes.ProposalStatus;
  type ProposalEntry = ProposalTypes.ProposalEntry;

  public type ProposalFilter = {
    status : ?ProposalStatus;
  };

  public func matchStatus(entry : ProposalEntry, status : ?ProposalStatus) : Bool {
    switch (status) {
      case null {
        return true;
      };
      case (?status) {
        return entry.status == status;
      };
    };
  };

};
