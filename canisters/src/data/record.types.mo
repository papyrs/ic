import Text "mo:base/Text";
import Time "mo:base/Time";
import Blob "mo:base/Blob";

module {

  public type RecordId = {
    id : Text;
  };

  public type Record = RecordId and {
    data : Blob;
  };

  public type RecordTimestamp = {
    created_at : Time.Time;
    updated_at : Time.Time;
  };

  /**
    * Same as above but with fields optional.
    * When data are submitted it can be the first time, therefore might have no timestamps yet
    */
  public type PartialRecordTimestamp = {
    created_at : ?Time.Time;
    updated_at : ?Time.Time;
  };

  /**
     * To delete a record we need the id but also timestamp to be sure user explicitely delete most actual version
     */
  public type DeleteRecord = RecordId and {
    updated_at : Time.Time;
  };

}