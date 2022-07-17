import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";

import Store "../stores/store";

import Filter "./feed.filter";
import FeedTypes "./feed.types";

module {
    type FeedFilter = Filter.FeedFilter;

    type BlogPost = FeedTypes.BlogPost;

    public class FeedStore() {
        private let store: Store.Store<BlogPost> = Store.Store<BlogPost>();

        public func put(key: Text, value: BlogPost) {
            store.put(key, value);
        };

        public func get(key: Text): ?BlogPost {
            return store.get(key);
        };

        public func del(key: Text): ?BlogPost {
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

        public func preupgrade(): HashMap.HashMap<Text, BlogPost> {
            return store.preupgrade();
        };

        public func postupgrade(stableData: [(Text, BlogPost)]) {
            store.postupgrade(stableData);
        };
    }
}
