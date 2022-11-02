import Text "mo:base/Text";
import Time "mo:base/Time";
import Blob "mo:base/Blob";

import RecordTypes "./record.types";

module {

  public type Data = RecordTypes.Record and RecordTypes.RecordTimestamp;
  public type PutData = RecordTypes.Record and RecordTypes.PartialRecordTimestamp;
  public type DelData = RecordTypes.DeleteRecord;

};
