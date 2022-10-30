import type {ActorMethod} from '@dfinity/agent';
import type {Principal} from '@dfinity/principal';

export interface Bucket {
  owner: UserId;
  bucketId: [] | [BucketId];
}
export type BucketId = Principal;
export type UserId = Principal;
export interface _SERVICE {
  cyclesBalance: ActorMethod<[], bigint>;
  delData: ActorMethod<[], boolean>;
  delStorage: ActorMethod<[], boolean>;
  getData: ActorMethod<[], [] | [Bucket]>;
  getStorage: ActorMethod<[], [] | [Bucket]>;
  initData: ActorMethod<[], Bucket>;
  initStorage: ActorMethod<[], Bucket>;
  installCode: ActorMethod<[Principal, Array<number>, Array<number>], undefined>;
  knownBucket: ActorMethod<[string, string], boolean>;
  list: ActorMethod<[string], Array<Bucket>>;
  storageLoadWasm: ActorMethod<[Array<number>], {total: bigint; chunks: bigint}>;
  storageResetWasm: ActorMethod<[], undefined>;
  transferCycles: ActorMethod<[Principal, bigint], undefined>;
}
