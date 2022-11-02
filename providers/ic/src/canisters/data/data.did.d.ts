import type {ActorMethod} from '@dfinity/agent';
import type {Principal} from '@dfinity/principal';

export interface Data {
  id: string;
  updated_at: Time;
  data: Array<number>;
  created_at: Time;
}
export interface DataBucket {
  countLikes: ActorMethod<[string], bigint>;
  cyclesBalance: ActorMethod<[], bigint>;
  del: ActorMethod<[string], undefined>;
  delete: ActorMethod<[string, DelData], undefined>;
  deleteInteraction: ActorMethod<[string, DelInteraction], undefined>;
  get: ActorMethod<[string], [] | [Data]>;
  getComment: ActorMethod<[string, string], [] | [Interaction]>;
  getLike: ActorMethod<[string], [] | [Interaction]>;
  list: ActorMethod<[[] | [RecordFilter]], Array<[string, Data]>>;
  listComments: ActorMethod<[string], Array<[string, Interaction]>>;
  listInteractions: ActorMethod<
    [Array<string>],
    Array<
      [
        string,
        {
          countComments: bigint;
          countLikes: bigint;
          like: [] | [Interaction];
        }
      ]
    >
  >;
  put: ActorMethod<[string, PutData], Data>;
  putInteraction: ActorMethod<[string, PutInteraction], Interaction>;
  set: ActorMethod<[string, Data], undefined>;
  transferFreezingThresholdCycles: ActorMethod<[], undefined>;
}
export interface DelData {
  id: string;
  updated_at: Time;
}
export interface DelInteraction {
  id: string;
  updated_at: Time;
}
export interface Interaction {
  id: string;
  updated_at: Time;
  data: Array<number>;
  created_at: Time;
  author: UserId;
}
export interface PutData {
  id: string;
  updated_at: [] | [Time];
  data: Array<number>;
  created_at: [] | [Time];
}
export interface PutInteraction {
  id: string;
  updated_at: [] | [Time];
  data: Array<number>;
  created_at: [] | [Time];
  author: UserId;
}
export interface RecordFilter {
  notContains: [] | [string];
  startsWith: [] | [string];
}
export type Time = bigint;
export type UserId = Principal;
export interface _SERVICE extends DataBucket {}
