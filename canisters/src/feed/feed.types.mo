import Text "mo:base/Text";
import Time "mo:base/Time";
import Blob "mo:base/Blob";
import Principal "mo:base/Principal";

module {

    /**
     * Blog post status is meant to prevent SPAM and submission that does not comply with the terms of use
     */
    public type BlogPostStatus = {
        #open;
        #declined;
        #accepted;
    };

    public type BlogPost = {
        id: Text;

        storageId: Principal;
        fullPath: Text;

        status: BlogPostStatus;

        meta: Blob;

        created_at: Time.Time;
        updated_at: Time.Time;
    };

}
