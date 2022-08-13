import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Int "mo:base/Int";

import Store "../stores/store";

import Filter "./data.filter";
import DataTypes "./data.types";

module {
    type DataFilter = Filter.DataFilter;

    type Data = DataTypes.Data;

    public class DataStore() {
        private let store: Store.Store<Data> = Store.Store<Data>();

        /// @deprecated The new put function checks the timestamp to avoid data to be overwritten
        public func putNoChecks(key: Text, value: Data) {
            store.put(key, value);
        };

        public func put(key: Text, {id; data; updated_at;}: Data): Result.Result<Data, Text> {
            let entry: ?Data = get(key);

            let now: Time.Time = Time.now();

            switch (entry) {
                case null {
                    let newData: Data = {
                        id;
                        data;
                        created_at = now;
                        updated_at = now;
                    };

                    store.put(key, newData);

                    return #ok newData;
                };
                case (?entry) {
                    if (entry.updated_at != updated_at) {
                        return #err ("Data timestamp is outdated or in the future - updated_at does not match current data. " # Int.toText(entry.updated_at) # " " # Int.toText(updated_at));
                    };

                    // Should never happens since keys are in sync with ids
                    if (entry.id != id) {
                        return #err "Data id does not match.";
                    };

                    let updateData: Data = {
                        id;
                        data;
                        created_at = entry.created_at;
                        updated_at = now;
                    };

                    store.put(key, updateData);

                    return #ok updateData;
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
