import Cycles "mo:base/ExperimentalCycles";
import Error "mo:base/Error";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Blob "mo:base/Blob";

import Types "../types/types";
import IC "../types/ic.types";

import CanisterUtils "../utils/canister.utils";
import WalletUtils "../utils/wallet.utils";

import BucketTypes "./bucket.types";
import BucketStore "./bucket.store";

import DataBucket "../data/data";

import Utils "../utils/utils";

actor Manager {
  private type UserId = Types.UserId;

  private type DataBucket = DataBucket.DataBucket;

  private type Bucket = BucketTypes.Bucket;
  private type BucketId = BucketTypes.BucketId;

  private let walletUtils : WalletUtils.WalletUtils = WalletUtils.WalletUtils();
  private let canisterUtils : CanisterUtils.CanisterUtils = CanisterUtils.CanisterUtils();

  let dataStore : BucketStore.BucketStore = BucketStore.BucketStore();
  let storagesStore : BucketStore.BucketStore = BucketStore.BucketStore();

  // Preserve the application state on upgrades
  private stable var data : [(Principal, BucketTypes.Bucket)] = [];
  private stable var storages : [(Principal, BucketTypes.Bucket)] = [];

  private let ic : IC.Self = actor "aaaaa-aa";

  private stable var storageWasm : [Nat8] = [];

  /**
     * Data
     */

  public shared ({caller}) func initData() : async (Bucket) {
    return await initBucket(caller, dataStore, initNewDataBucket);
  };

  private func initNewDataBucket(manager : Principal, user : UserId) : async (Principal) {
    Cycles.add(1_000_000_000_000);
    let b : DataBucket = await DataBucket.DataBucket(user);

    let canisterId : Principal = Principal.fromActor(b);

    await canisterUtils.updateSettings(canisterId, manager);

    return canisterId;
  };

  public shared query ({caller}) func getData() : async ?Bucket {
    let result : Result.Result<?Bucket, Text> = dataStore.getBucket(caller);

    switch (result) {
      case (#err error) {
        throw Error.reject(error);
      };
      case (#ok bucket) {
        switch (bucket) {
          case (?bucket) {
            return ?bucket;
          };
          case null {
            // We do not throw a "Not found error" here.
            // For performance reason, in web app we first query if the bucket exists and then if not, we init it.
            return null;
          };
        };
      };
    };
  };

  public shared ({caller}) func delData() : async (Bool) {
    return await delBucket(caller, dataStore);
  };

  /**
     * Storages
     */

  public shared ({caller}) func initStorage() : async (Bucket) {
    return await initBucket(caller, storagesStore, initNewStorageBucket);
  };

  private func initNewStorageBucket(manager : Principal, user : UserId) : async (Principal) {
    Cycles.add(1_000_000_000_000);

    let {canister_id} = await ic.create_canister({settings = null});

    await canisterUtils.updateSettings(canister_id, manager);

    let arg : Blob = to_candid (user);

    await ic.install_code(
      {
        arg;
        wasm_module = Blob.fromArray(storageWasm);
        mode = #install;
        canister_id;
      }
    );

    return canister_id;
  };

  public shared query ({caller}) func getStorage() : async ?Bucket {
    let result : Result.Result<?Bucket, Text> = storagesStore.getBucket(caller);

    switch (result) {
      case (#err error) {
        throw Error.reject(error);
      };
      case (#ok bucket) {
        switch (bucket) {
          case (?bucket) {
            return ?bucket;
          };
          case null {
            // We do not throw a "Not found error" here.
            // For performance reason, in web app we first query if the bucket exists and then if not, we init it.
            return null;
          };
        };
      };
    };
  };

  public shared ({caller}) func delStorage() : async (Bool) {
    return await delBucket(caller, storagesStore);
  };

  /**
     * Buckets
     */

  private func initBucket(
    caller : Principal,
    store : BucketStore.BucketStore,
    initNewBucket : (manager : Principal, user : UserId) -> async (Principal)
  ) : async (Bucket) {
    let self : Principal = Principal.fromActor(Manager);

    let result : Result.Result<Bucket, Text> = await store.init(self, caller, initNewBucket);

    switch (result) {
      case (#err error) {
        throw Error.reject(error);
      };
      case (#ok bucket) {
        return bucket;
      };
    };
  };

  private func delBucket(caller : Principal, store : BucketStore.BucketStore) : async (Bool) {
    let result : Result.Result<?Bucket, Text> = await store.deleteBucket(caller);

    switch (result) {
      case (#err error) {
        throw Error.reject(error);
      };
      case (#ok bucket) {
        let exists : Bool = Option.isSome(bucket);
        return exists;
      };
    };
  };

  /**
    * Utilities
  */

  // is a canister id known by the manager?
  public shared func knownBucket(bucketId : Text, store : Text) : async (Bool) {
    if (Text.equal(store, "data")) {
      return dataStore.exists(Principal.fromText(bucketId));
    };

    if (Text.equal(store, "storage")) {
      return storagesStore.exists(Principal.fromText(bucketId));
    };

    throw Error.reject("Type of store not supported");
  };

  public shared ({caller}) func knownUser(userId : UserId, store : Text) : async (Bool) {
    if (Text.equal(store, "data")) {
      let exists : Bool = dataStore.exists(caller);

      if (not exists) {
        throw Error.reject("Caller is not a known data bucket.");
      };

      let result : Result.Result<?Bucket, Text> = dataStore.getBucket(userId);

      switch (result) {
        case (#err error) {
          throw Error.reject(error);
        };
        case (#ok bucket) {
          switch (bucket) {
            case (?bucket) {
              return true;
            };
            case null {
              return false;
            };
          };
        };
      };
    };

    if (Text.equal(store, "storage")) {
      let exists : Bool = storagesStore.exists(caller);

      if (not exists) {
        throw Error.reject("Caller is not a known storage bucket.");
      };

      let result : Result.Result<?Bucket, Text> = storagesStore.getBucket(userId);

      switch (result) {
        case (#err error) {
          throw Error.reject(error);
        };
        case (#ok bucket) {
          switch (bucket) {
            case (?bucket) {
              return true;
            };
            case null {
              return false;
            };
          };
        };
      };
    };

    throw Error.reject("Type of store not supported");
  };

  /**
     * Admin: restricted for manager
     */

  public shared query ({caller}) func list(store : Text) : async [Bucket] {
    if (not Utils.isAdmin(caller)) {
      throw Error.reject("Unauthorized access. Caller is not an admin. " # Principal.toText(caller));
    };

    if (Text.equal(store, "data")) {
      return dataStore.entries();
    };

    if (Text.equal(store, "storage")) {
      return storagesStore.entries();
    };

    throw Error.reject("Type of store not supported");
  };

  public shared ({caller}) func installCode(canisterId : Principal, owner : Blob, wasmModule : Blob) : async () {
    if (not Utils.isAdmin(caller)) {
      throw Error.reject("Unauthorized access. Caller is not an admin. " # Principal.toText(caller));
    };

    await canisterUtils.installCode(canisterId, owner, wasmModule);
  };

  /// @deprecated anyone can transfer cycles to any canister on the IC
  public shared ({caller}) func transferCycles(canisterId : Principal, amount : Nat) : async () {
    if (not Utils.isAdmin(caller)) {
      throw Error.reject("Unauthorized access. Caller is not an admin. " # Principal.toText(caller));
    };

    await walletUtils.transferCycles(canisterId, amount);
  };

  public shared query ({caller}) func cyclesBalance() : async (Nat) {
    if (not Utils.isAdmin(caller)) {
      throw Error.reject("Unauthorized access. Caller is not an admin. " # Principal.toText(caller));
    };

    return walletUtils.cyclesBalance();
  };

  // Source:
  // https://github.com/ORIGYN-SA/large_canister_deployer_internal
  // https://forum.dfinity.org/t/read-local-file-at-build-time-with-motoko/15945/2

  public shared ({caller}) func storageResetWasm() : async () {
    if (not Utils.isAdmin(caller)) {
      throw Error.reject("Unauthorized access. Caller is not an admin. " # Principal.toText(caller));
    };

    storageWasm := [];
  };

  public shared ({caller}) func storageLoadWasm(blob : [Nat8]) : async ({total : Nat; chunks : Nat}) {
    if (not Utils.isAdmin(caller)) {
      throw Error.reject("Unauthorized access. Caller is not an admin. " # Principal.toText(caller));
    };

    // Issue: https://forum.dfinity.org/t/array-to-buffer-in-motoko/15880/15
    // let buffer: Buffer.Buffer<Nat8> = Buffer.fromArray<Nat8>(storageWasm);
    // let chunks: Buffer.Buffer<Nat8> = Buffer.fromArray<Nat8>(blob);
    // buffer.append(chunks);
    // storageWasm := buffer.toArray();

    storageWasm := Array.append<Nat8>(storageWasm, blob);

    // return total wasm sizes
    return {
      total = storageWasm.size();
      chunks = blob.size();
    };
  };

  /**
     * Stable memory for upgrade
     */

  system func preupgrade() {
    data := Iter.toArray(dataStore.preupgrade().entries());
    storages := Iter.toArray(storagesStore.preupgrade().entries());
  };

  system func postupgrade() {
    dataStore.postupgrade(data);
    data := [];

    storagesStore.postupgrade(storages);
    storages := [];
  };
};
