import type {ActorMethod} from '@dfinity/agent';
import type {Principal} from '@dfinity/principal';

export interface Data {
  id: string;
  updated_at: Time;
  data: Array<number>;
  created_at: Time;
}
export interface DataBucket {
  cyclesBalance: ActorMethod<[], bigint>;
  del: ActorMethod<[string], undefined>;
  get: ActorMethod<[string], [] | [Data]>;
  list: ActorMethod<[[] | [DataFilter]], Array<[string, Data]>>;
  put: ActorMethod<[string, Data], Data>;
  /**
   * @deprecated
   */
  set: ActorMethod<[string, Data], undefined>;
  transferFreezingThresholdCycles: ActorMethod<[], undefined>;
}
export interface DataFilter {
  notContains: [] | [string];
  startsWith: [] | [string];
}
export type Time = bigint;
export type UserId = Principal;
export interface _SERVICE extends DataBucket {}
