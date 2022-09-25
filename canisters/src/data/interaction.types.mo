import Text "mo:base/Text";
import Time "mo:base/Time";
import Blob "mo:base/Blob";

import DataTypes "./data.types";
import RecordTypes "./record.types";
import Types "../types/types";

module {

  public type InteractionRecord = RecordTypes.Record and {
    author: Types.UserId;
  };

  public type Interaction = InteractionRecord and RecordTypes.RecordTimestamp;
  public type PutInteraction = InteractionRecord and RecordTypes.PartialRecordTimestamp;
  public type DelInteraction = RecordTypes.DeleteRecord;

  /**
   * A comment e.g. can be deleted by its author or the owner of the canister.
   */
  public type InteractionUsers = {
    // Who calls the the function - the canister update call
    caller: Types.UserId;
    // The user - owner of the canister
    user: Types.UserId;
  };

}