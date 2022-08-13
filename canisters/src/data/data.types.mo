import Text "mo:base/Text";
import Time "mo:base/Time";
import Blob "mo:base/Blob";

module {

    public type DataRecord = {
        id: Text;
        data: Blob;
    };

    public type Data = DataRecord and {
        created_at: Time.Time;
        updated_at: Time.Time;
    };

    /**
     * Same as data but with timestamp optional
     * When data are submitted it can be the first time, therefore have no timestamps yet
     */
    public type PutData = DataRecord and {
        created_at: ?Time.Time;
        updated_at: ?Time.Time;
    };

};
