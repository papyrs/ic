import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Hash "mo:base/Hash";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Buffer "mo:base/Buffer";

import StorageTypes "./storage.types";

import Sha256Utils "../utils/sha256.utils";

module {

  type Chunk = StorageTypes.Chunk;
  type Asset = StorageTypes.Asset;
  type Batch = StorageTypes.Batch;

  type AssetKey = StorageTypes.AssetKey;
  type AssetEncoding = StorageTypes.AssetEncoding;

  public class StorageStore() {

    private let BATCH_EXPIRY_NANOS = 300_000_000_000;
    // 300 seconds, 5 minutes

    private let batches : HashMap.HashMap<Nat, Batch> = HashMap.HashMap<Nat, Batch>(
      10,
      Nat.equal,
      Hash.hash
    );

    private let chunks : HashMap.HashMap<Nat, Chunk> = HashMap.HashMap<Nat, Chunk>(
      10,
      Nat.equal,
      Hash.hash
    );

    private var assets : HashMap.HashMap<Text, Asset> = HashMap.HashMap<Text, Asset>(
      10,
      Text.equal,
      Text.hash
    );

    private var nextBatchID : Nat = 0;
    private var nextChunkID : Nat = 0;

    /**
         * Getter, list and delete
         */

    public func getAssetForUrl(url : Text) : Result.Result<Asset, Text> {
      if (Text.size(url) == 0) {
        return #err "No url provided.";
      };

      let split : [Text] = Iter.toArray(Text.split(url, #text "?token="));
      let fullPath : Text = "/" # Text.trimStart(split[0], #char '/');

      // Token protected assets
      if (split.size() > 1) {
        let token : Text = split[1];
        return getAsset(fullPath, ?token);
      };

      // Map /index.html to / because we are using / as root
      if (fullPath == "/index.html") {
        return getAsset("/", null);
      };

      return getAsset(fullPath, null);
    };

    public func getAsset(fullPath : Text, token : ?Text) : Result.Result<Asset, Text> {
      let asset : ?Asset = assets.get(fullPath);

      switch (asset) {
        case (?asset) {
          switch (asset.key.token) {
            case (?assetToken) {
              return getProtectedAsset(asset, assetToken, token);
            };
            case (null) {
              return #ok asset;
            };
          };
        };
        case null {
          return #err "No asset.";
        };
      };
    };

    private func getProtectedAsset(asset : Asset, assetToken : Text, token : ?Text) : Result.Result<Asset, Text> {
      switch (token) {
        case null {
          return #err "No token provided.";
        };
        case (?token) {
          let compare : {#less; #equal; #greater} = Text.compare(token, assetToken);

          switch (compare) {
            case (#equal equal) {
              return #ok asset;
            };
            case (#less less) {
              return #err "Invalid token.";
            };
            case (#greater greater) {
              return #err "Invalid token.";
            };
          };
        };
      };
    };

    public func deleteAsset(fullPath : Text, token : ?Text) : Result.Result<Asset, Text> {
      let result : Result.Result<Asset, Text> = getAsset(fullPath, token);

      switch (result) {
        case (#ok asset) {
          assets.delete(fullPath);
        };
        case (#err error) {};
      };

      return result;
    };

    public func getKeys(folder : ?Text) : [AssetKey] {
      let entries : Iter.Iter<(Text, Asset)> = assets.entries();
      let keys : Iter.Iter<AssetKey> = Iter.map(
        entries,
        func((fullPath : Text, value : Asset)) : AssetKey {value.key}
      );
      let allKeys : [AssetKey] = Iter.toArray(keys);

      switch (folder) {
        case null {
          return allKeys;
        };
        case (?folder) {
          let filteredKeys : [AssetKey] = Array.filter<AssetKey>(
            allKeys,
            func(key : AssetKey) : Bool {Text.equal(key.folder, folder)}
          );
          return filteredKeys;
        };
      };
    };

    public func getShas(folder : ?Text) : [{key : AssetKey; sha256 : ?[Nat8]}] {
      let keys : [AssetKey] = getKeys(folder);

      let shas : Buffer.Buffer<{key : AssetKey; sha256 : ?[Nat8]}> = Buffer.Buffer(1);

      for (key in keys.vals()) {
        let result : Result.Result<Asset, Text> = getAsset(key.fullPath, key.token);

        switch (result) {
          case (#ok asset) {
            shas.add({key; sha256 = asset.encoding.sha256});
          };
          case (#err error) {};
        };
      };

      return shas.toArray();
    };

    /**
         * Upload batch and chunks
         */

    public func createBatch(key : AssetKey) : (Nat) {
      nextBatchID := nextBatchID + 1;

      let now : Time.Time = Time.now();

      clearExpiredBatches();

      batches.put(
        nextBatchID,
        {
          key;
          expiresAt = now + BATCH_EXPIRY_NANOS;
        }
      );

      return nextBatchID;
    };

    public func createChunk({batchId : Nat; content : [Nat8]} : Chunk) : (
      {#chunkId : Nat; #error : Text}
    ) {
      switch (batches.get(batchId)) {
        case (null) {
          return #error "Batch not found.";
        };
        case (?batch) {
          // Extend batch timeout
          batches.put(
            batchId,
            {
              key = batch.key;
              expiresAt = Time.now() + BATCH_EXPIRY_NANOS;
            }
          );

          nextChunkID := nextChunkID + 1;

          chunks.put(
            nextChunkID,
            {
              batchId;
              content;
            }
          );

          return #chunkId nextChunkID;
        };
      };
    };

    public func commitBatch(
      {batchId; chunkIds; headers} : {
        batchId : Nat;
        headers : [(Text, Text)];
        chunkIds : [Nat];
      }
    ) : ({error : ?Text}) {
      let batch : ?Batch = batches.get(batchId);

      switch (batch) {
        case (null) {
          return {error = ?"No batch to commit."};
        };
        case (?batch) {
          let error : {error : ?Text} = commitChunks({batchId; batch; chunkIds; headers});
          return error;
        };
      };
    };

    private func commitChunks(
      {batchId; batch; chunkIds; headers} : {
        batchId : Nat;
        batch : Batch;
        headers : [(Text, Text)];
        chunkIds : [Nat];
      }
    ) : ({error : ?Text}) {
      // Test batch is not expired
      let now : Time.Time = Time.now();
      if (now > batch.expiresAt) {
        clearExpiredBatches();
        return {error = ?"Batch did not complete in time. Chunks cannot be commited."};
      };

      let contentChunks : Buffer.Buffer<[Nat8]> = Buffer.Buffer(1);

      for (chunkId in chunkIds.vals()) {
        let chunk : ?Chunk = chunks.get(chunkId);

        switch (chunk) {
          case (?chunk) {
            if (Nat.notEqual(batchId, chunk.batchId)) {
              return {error = ?"Chunk not included in the provided batch"};
            };

            contentChunks.add(chunk.content);
          };
          case null {
            return {error = ?"Chunk does not exist."};
          };
        };
      };

      if (contentChunks.size() <= 0) {
        return {error = ?"No chunk to commit."};
      };

      let sha256Digest : Sha256Utils.Digest = Sha256Utils.Digest();
      var totalLength = 0;

      for (chunk in contentChunks.vals()) {
        totalLength += chunk.size();
        sha256Digest.write(chunk);
      };

      assets.put(
        batch.key.fullPath,
        {
          key = batch.key;
          headers;
          encoding = {
            modified = Time.now();
            contentChunks = contentChunks.toArray();
            totalLength;
            sha256 = ?sha256Digest.sum();
          };
        }
      );

      clearBatch({batchId; chunkIds});

      return {error = null};
    };

    private func clearBatch({batchId : Nat; chunkIds : [Nat]} : {batchId : Nat; chunkIds : [Nat]}) {
      for (chunkId in chunkIds.vals()) {
        chunks.delete(chunkId);
      };

      batches.delete(batchId);
    };

    private func clearExpiredBatches() {
      let now : Time.Time = Time.now();

      // Remove expired batches
      let batchEntries : Iter.Iter<(Nat, Batch)> = batches.entries();
      for ((batchId : Nat, batch : Batch) in batchEntries) {
        if (now > batch.expiresAt) {
          batches.delete(batchId);
        };
      };

      // Remove chunk without existing batches (those we just deleted above)
      for ((chunkId : Nat, chunk : Chunk) in chunks.entries()) {
        switch (batches.get(chunk.batchId)) {
          case (null) {chunks.delete(chunkId)};
          case (?batch) {};
        };
      };
    };

    public func preupgrade() : HashMap.HashMap<Text, Asset> {
      return assets;
    };

    public func postupgrade(stableAssets : [(Text, Asset)]) {
      // TODO: remove - temporary migration of the sha256 values
      // For simplicity and performance reason, we just set null for previous values for the sha256.
      // In any case next time resources are uploaded they will get a sha256 and dapp frontend handles undefined values.
      // But we explicitly set a value to avoid issue in the future - see https://forum.dfinity.org/t/loosing-data-when-upgrading-records/8672
      let migrateShas : Buffer.Buffer<(Text, Asset)> = Buffer.Buffer(1);

      for ((key, asset) in stableAssets.vals()) {
        let assetEncoding : AssetEncoding = {
          modified = asset.encoding.modified;
          contentChunks = asset.encoding.contentChunks;
          totalLength = asset.encoding.totalLength;
          sha256 = null;
        };

        let newAsset : Asset = {
          key = asset.key;
          headers = asset.headers;
          encoding = assetEncoding;
        };

        migrateShas.add((key, newAsset));
      };

      assets := HashMap.fromIter<Text, Asset>(migrateShas.toArray().vals(), 10, Text.equal, Text.hash);

      // TODO: revert - temporary migration of the sha256 values
      // assets := HashMap.fromIter<Text, Asset>(stableAssets.vals(), 10, Text.equal, Text.hash);
    };
  }

};
