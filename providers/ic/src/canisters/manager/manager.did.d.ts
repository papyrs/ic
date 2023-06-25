import type {ActorMethod} from '@dfinity/agent';
import type {Principal} from '@dfinity/principal';

export interface Bucket {
  owner: UserId;
  bucketId: [] | [BucketId];
}
export type BucketId = Principal;
export type UserId = Principal;
export type UserId__1 = Principal;
export interface _SERVICE {
  cyclesBalance: ActorMethod<[], bigint>;
  delData: ActorMethod<[], boolean>;
  delStorage: ActorMethod<[], boolean>;
  getData: ActorMethod<[], [] | [Bucket]>;
  getDataControllers: ActorMethod<[], [] | [Array<Principal>]>;
  getStorage: ActorMethod<[], [] | [Bucket]>;
  getStorageControllers: ActorMethod<[], [] | [Array<Principal>]>;
  initData: ActorMethod<[], Bucket>;
  initStorage: ActorMethod<[], Bucket>;
  installCode: ActorMethod<[Principal, Uint8Array | number[], Uint8Array | number[]], undefined>;
  knownBucket: ActorMethod<[string, string], boolean>;
  knownUser: ActorMethod<[UserId__1, string], boolean>;
  list: ActorMethod<[string], Array<Bucket>>;
  setDataController: ActorMethod<[Principal], undefined>;
  setStorageController: ActorMethod<[Principal], undefined>;
  storageLoadWasm: ActorMethod<[Uint8Array | number[]], {total: bigint; chunks: bigint}>;
  storageResetWasm: ActorMethod<[], undefined>;
  transferCycles: ActorMethod<[Principal, bigint], undefined>;
}
