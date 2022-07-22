import Text "mo:base/Text";
import Time "mo:base/Time";
import Blob "mo:base/Blob";

import IC "../types/ic.types";

module {

    public type Post = {
        id: Text;
        storageId: IC.canister_id;
        meta: Blob;

        created_at: Time.Time;
        updated_at: Time.Time;
    };

}
