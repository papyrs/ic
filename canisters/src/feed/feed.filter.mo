import Text "mo:base/Text";

import FeedTypes "./feed.types";

module {

    type BlogPostStatus = FeedTypes.BlogPostStatus;
    type BlogPost = FeedTypes.BlogPost;

    public type FeedFilter = {
        status: ?BlogPostStatus;
    };

    public func matchStatus(blogPost: BlogPost, status: ?BlogPostStatus): Bool {
        switch (status) {
            case null {
                return true;
            };
            case (?status) {
                return blogPost.status == status;
            };
        };
    };

}
