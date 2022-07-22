import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";

import Store "../stores/store";

import Filter "./data.filter";
import DataTypes "./data.types";

module {
    type DataFilter = Filter.DataFilter;

    type Data = DataTypes.Data;

    public class DataStore() {
        private let store: Store.Store<Data> = Store.Store<Data>();

        public func put(key: Text, value: Data) {
            store.put(key, value);
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
