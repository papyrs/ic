import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Error "mo:base/Error";

import Types "../types/types";
import DataTypes "./data.types";

import Filter "./data.filter";

import Utils "../utils/utils";

import WalletUtils "../utils/wallet.utils";

import DataStore "./data.store";

actor class DataBucket(owner: Types.UserId) = this {

  type UserId = Types.UserId;

  type Data = DataTypes.Data;
  type PutData = DataTypes.PutData;
  type DelData = DataTypes.DelData;

  type DataFilter = Filter.DataFilter;

  private stable let user: Types.UserId = owner;

  private let walletUtils: WalletUtils.WalletUtils = WalletUtils.WalletUtils();

  private let store: DataStore.DataStore = DataStore.DataStore();

  // Preserve the application state on upgrades
  private stable var entries : [(Text, Data)] = [];

   /**
    * Data
    */

  public shared query({ caller }) func get(key: Text) : async (?Data) {
    if (Utils.isPrincipalNotEqual(caller, user)) {
        throw Error.reject("User does not have the permission to get the data.");
    };

    let entry: ?Data = store.get(key);
    return entry;
  };

  public shared query({ caller }) func list(filter: ?DataFilter) : async [(Text, Data)] {
    if (Utils.isPrincipalNotEqual(caller, user)) {
        throw Error.reject("User does not have the permission to list the data.");
    };

    let results: [(Text, Data)] = store.entries(filter);
    return results;
  };

  /// @deprecated Backwards compatibility - function will be removed few weeks after the dapp has been updated to avoid issue with caches 
  public shared({ caller }) func set(key: Text, data: Data) : async () {
    if (Utils.isPrincipalNotEqual(caller, user)) {
        throw Error.reject("User does not have the permission to set data.");
    };

    store.putNoChecks(key, data);
  };

  public shared({ caller }) func put(key: Text, data: PutData) : async (Data) {
    if (Utils.isPrincipalNotEqual(caller, user)) {
        throw Error.reject("User does not have the permission to set data.");
    };

    let result: Result.Result<Data, Text> = store.put(key, data);

    switch (result) {
        case (#err error) {
            throw Error.reject(error);
        };
        case (#ok resultData) {
          return resultData;
        };
    };
  };

  /// @deprecated Backwards compatibility - function will be removed few weeks after the dapp has been updated to avoid issue with caches 
  public shared({ caller }) func del(key: Text) : async () {
    if (Utils.isPrincipalNotEqual(caller, user)) {
        throw Error.reject("User does not have the permission to delete the data.");
    };

    let entry: ?Data = store.delNoChecks(key);
  };

  public shared({ caller }) func delete(key: Text, data: DelData) : async () {
    if (Utils.isPrincipalNotEqual(caller, user)) {
        throw Error.reject("User does not have the permission to delete the data.");
    };

    let result: Result.Result<?Data, Text> = store.del(key, data);

    switch (result) {
        case (#err error) {
            throw Error.reject(error);
        };
        case (#ok resultData) {
        };
    };
  };

  /**
   * Canister mgmt
   */

  public shared({ caller }) func transferFreezingThresholdCycles(): async() {
      if (not Utils.isManager(caller)) {
          throw Error.reject("Unauthorized access. Caller is not a manager.");
      };

      await walletUtils.transferFreezingThresholdCycles(caller);
  };

  public shared query({ caller }) func cyclesBalance(): async (Nat) {
      if (not Utils.isManager(caller) and Utils.isPrincipalNotEqual(caller, user)) {
          throw Error.reject("No permission to read the balance of the cycles.");
      };

      return walletUtils.cyclesBalance();
  };

  system func preupgrade() {
      entries := Iter.toArray(store.preupgrade().entries());
  };

  system func postupgrade() {
      store.postupgrade(entries);
      entries := [];
  };

};
