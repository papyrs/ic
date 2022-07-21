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
        meta: Blob;

        status: BlogPostStatus;

        created_at: Time.Time;
        updated_at: Time.Time;
    };

    public type BlogPostSubmission = {
        id: Text;
        storageId: Principal;
        meta: Blob;
    };

}
