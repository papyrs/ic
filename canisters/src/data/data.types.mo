import Text "mo:base/Text";
import Time "mo:base/Time";
import Blob "mo:base/Blob";

module {

    public type Data = {
        id: Text;

        data: Blob;

        created_at: Time.Time;
        updated_at: Time.Time;
    };

    /**
     * Same as data but with timestamp optional
     * When data are submitted it can be the first time, therefore have no timestamps yet
     */
    public type PutData = {
        id: Text;

        data: Blob;

        created_at: ?Time.Time;
        updated_at: ?Time.Time;
    };

}
