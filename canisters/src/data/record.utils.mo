import Result "mo:base/Result";
import Int "mo:base/Int";
import Time "mo:base/Time";

import RecordTypes "./record.types";

module {

    type Record = RecordTypes.Record;
    type RecordTimestamp = RecordTypes.RecordTimestamp;

    public func checkTimestamp(record : Record and RecordTimestamp, id : Text, updated_at : Time.Time) : Result.Result<Text, Text> {
      if (record.updated_at != updated_at) {
        return #err(
          "Interaction timestamp is outdated or in the future - updated_at does not match most recent timesteamp. " # Int.toText(
            record.updated_at
          ) # " - " # Int.toText(updated_at)
        );
      };

      // Should never happens since keys are in sync with ids
      if (record.id != id) {
        return #err("Interaction ids do not match. " # record.id # " - " # id);
      };

      return #ok "Timestamps are matching.";
    };

};