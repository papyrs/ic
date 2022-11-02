import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Int "mo:base/Int";

import Store "../stores/store";

import Filter "./record.filter";
import DataTypes "./data.types";

import RecordUtils "./record.utils";

module {
  type RecordFilter = Filter.RecordFilter;

  type Data = DataTypes.Data;
  type PutData = DataTypes.PutData;
  type DelData = DataTypes.DelData;

  public class DataStore() {
    private let store : Store.Store<Data> = Store.Store<Data>();

    public func put(key : Text, putData : PutData) : Result.Result<Data, Text> {
      let record : ?Data = get(key);

      switch (record) {
        case null {
          let newData : Data = create(key, putData);
          return #ok newData;
        };
        case (?record) {
          return update(key, record, putData);
        };
      };
    };

    private func update(key : Text, record : Data, putData : PutData) : Result.Result<Data, Text> {
      let {id; data; updated_at} = putData;

      switch (updated_at) {
        case null {
          return #err "No timestamp provided to update the data";
        };
        case (?updated_at) {
          let timestamp : Result.Result<Text, Text> = RecordUtils.checkTimestamp(
            record,
            id,
            updated_at
          );

          switch (timestamp) {
            case (#err error) {
              return #err error;
            };
            case (#ok text) {
              let now : Time.Time = Time.now();

              let updateData : Data = {
                id;
                data;
                created_at = record.created_at;
                updated_at = now;
              };

              store.put(key, updateData);

              return #ok updateData;
            };
          };
        };
      };
    };

    private func create(key : Text, {id; data} : PutData) : Data {
      let now : Time.Time = Time.now();

      let newData : Data = {
        id;
        data;
        created_at = now;
        updated_at = now;
      };

      store.put(key, newData);

      return newData;
    };

    public func get(key : Text) : ?Data {
      return store.get(key);
    };

    public func del(key : Text, {id; updated_at} : DelData) : Result.Result<?Data, Text> {
      let record : ?Data = get(key);

      switch (record) {
        case null {
          // The function does not throw an error if data does not exists because a paragraph might have been created offline, never sync but still added to the list of deleted paragraphs to sync
          return #ok null;
        };
        case (?record) {
          let timestamp : Result.Result<Text, Text> = RecordUtils.checkTimestamp(
            record,
            id,
            updated_at
          );

          switch (timestamp) {
            case (#err error) {
              return #err error;
            };
            case (#ok text) {
              let result : ?Data = store.del(key);
              return #ok result;
            };
          };
        };
      };
    };

    public func entries(filter : ?RecordFilter) : [(Text, Data)] {
      return Filter.entries<Data>(store.entries(), filter);
    };

    public func preupgrade() : HashMap.HashMap<Text, Data> {
      return store.preupgrade();
    };

    public func postupgrade(stableData : [(Text, Data)]) {
      store.postupgrade(stableData);
    };
  };
};
