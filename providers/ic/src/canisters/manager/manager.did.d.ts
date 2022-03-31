import type {Principal} from '@dfinity/principal';
export interface Bucket {
  owner: UserId;
  bucketId: [] | [BucketId];
}
export type BucketId = Principal;
export interface CanisterStatus {
  status: {stopped: null} | {stopping: null} | {running: null};
  memory_size: bigint;
  cycles: bigint;
  settings: definite_canister_settings;
  module_hash: [] | [Array<number>];
}
export type UserId = Principal;
export interface definite_canister_settings {
  freezing_threshold: bigint;
  controllers: [] | [Array<Principal>];
  memory_allocation: bigint;
  compute_allocation: bigint;
}
export interface _SERVICE {
  delData: () => Promise<boolean>;
  delStorage: () => Promise<boolean>;
  getCanistersStatus: () => Promise<{data: CanisterStatus, storage: CanisterStatus}>;
  getData: () => Promise<[] | [Bucket]>;
  getStorage: () => Promise<[] | [Bucket]>;
  initData: () => Promise<Bucket>;
  initStorage: () => Promise<Bucket>;
  installCode: (arg_0: Principal, arg_1: Array<number>, arg_2: Array<number>) => Promise<undefined>;
  list: (arg_0: string) => Promise<Array<Bucket>>;
}
