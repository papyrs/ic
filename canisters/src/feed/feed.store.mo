import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Principal "mo:base/Principal";

import Store "../stores/store";

import Filter "./feed.filter";
import FeedTypes "./feed.types";

module {
    type FeedFilter = Filter.FeedFilter;

    type BlogPost = FeedTypes.BlogPost;
    type BlogPostStatus = FeedTypes.BlogPostStatus;

    public class FeedStore() {
        private let store: Store.Store<BlogPost> = Store.Store<BlogPost>();

        public func submit(blogPost: BlogPost) {
            // Clone to prevent submitted entries with another status that #open
            let post: BlogPost = cloneToStatus(blogPost, #open);

            store.put(toKey(post.storageId, post.id), post);
        };

        public func updateStatus(storageId: Principal, id: Text, status: BlogPostStatus) {
            let key: Text = toKey(storageId, id);
            let post: ?BlogPost = get(toKey(storageId, id));

            switch (post) {
                case (?post) {
                    let acceptedPost: BlogPost = cloneToStatus(post, status);
                    put(key, acceptedPost);
                };
                case (null) {};
            };
        };

        private func put(key: Text, value: BlogPost) {
            store.put(key, value);
        };

        private func get(key: Text): ?BlogPost {
            return store.get(key);
        };

        private func del(key: Text): ?BlogPost {
            return store.del(key);
        };

        public func entries(filter: ?FeedFilter): [(Text, BlogPost)] {
            let entries: Iter.Iter<(Text, BlogPost)> = store.entries();

            switch (filter) {
                case null {
                    return Iter.toArray(entries);
                };
                case (?filter) {
                    let keyValues: [(Text, BlogPost)] = Iter.toArray(entries);

                    let {status} = filter;

                    let values: [(Text, BlogPost)] = Array.mapFilter<(Text, BlogPost), (Text, BlogPost)>(keyValues, func ((key: Text, value: BlogPost)) : ?(Text, BlogPost) {
                        if (Filter.matchStatus(value, status)) {
                            return ?(key, value);
                        };

                        return null;
                    });


                    return values;
                };
            };
        };

        private func toKey(storageId: Principal, id: Text): Text {
            Principal.toText(storageId) # "-" # id
        };

        private func cloneToStatus(blogPost: BlogPost, status: BlogPostStatus): BlogPost {
            {
                id = blogPost.id;
                fullPath = blogPost.fullPath;
                meta = blogPost.meta;
                storageId = blogPost.storageId;
                status;
                created_at = blogPost.created_at;
                updated_at = blogPost.updated_at;
            };
        };

        public func preupgrade(): HashMap.HashMap<Text, BlogPost> {
            return store.preupgrade();
        };

        public func postupgrade(stableData: [(Text, BlogPost)]) {
            store.postupgrade(stableData);
        };
    }
}
