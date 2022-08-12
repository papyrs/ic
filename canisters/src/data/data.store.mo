import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Result "mo:base/Time";

import Store "../stores/store";

import Filter "./data.filter";
import DataTypes "./data.types";

module {
    type DataFilter = Filter.DataFilter;

    type Data = DataTypes.Data;

    public class DataStore() {
        private let store: Store.Store<Data> = Store.Store<Data>();

        public func put(key: Text, data: Data) {
            let entry: ?Data = get(key);

            let now: Time.Time = Time.now();
            
            switch (entry) {
                case null {
                    store.put(key, {
                        id;
                        data;
                        created_at = now;
                        updated_at = now;
                    });
                    return #ok "Data created.";
                };
                case (?entry) {
                    if (entry.updated_at != data.updated_at) {
                        return #err "Data timestamp is outdated or in the future - does not match current data.";
                    };

                    // Should never happens since keys are in sync with ids
                    if (entry.id != id) {
                        return #err "Data id does not match.";
                    };

                    store.put(key, {
                        id;
                        data;
                        created_at = entry.created_at;
                        updated_at = now;
                    });

                    return #ok "Data updated.";
                };
            };
        };

        public func get(key: Text): ?Data {
            return store.get(key);
        };

        public func del(key: Text): ?Data {
            return store.del(key);
        };

        public func entries(filter: ?DataFilter): [(Text, Data)] {
            let entries: Iter.Iter<(Text, Data)> = store.entries();

            switch (filter) {
                case null {
                    return Iter.toArray(entries);
                };
                case (?filter) {
                    let keyValues: [(Text, Data)] = Iter.toArray(entries);

                    let {startsWith; notContains} = filter;

                    let values: [(Text, Data)] = Array.mapFilter<(Text, Data), (Text, Data)>(keyValues, func ((key: Text, value: Data)) : ?(Text, Data) {
                        if (Filter.startsWith(key, startsWith) and Filter.notContains(key, notContains)) {
                            return ?(key, value);
                        };

                        return null;
                    });


                    return values;
                };
            };
        };

        public func preupgrade(): HashMap.HashMap<Text, Data> {
            return store.preupgrade();
        };

        public func postupgrade(stableData: [(Text, Data)]) {
            store.postupgrade(stableData);
        };
    }
}
