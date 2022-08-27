import type {ActorMethod} from '@dfinity/agent';
import type {Principal} from '@dfinity/principal';

export interface AssetKey {
  token: [] | [string];
  name: string;
  fullPath: string;
  folder: string;
}
export interface Chunk {
  content: Array<number>;
  batchId: bigint;
}
export type HeaderField = [string, string];
export type HeaderField__1 = [string, string];
export interface HttpRequest {
  url: string;
  method: string;
  body: Array<number>;
  headers: Array<HeaderField>;
}
export interface HttpResponse {
  body: Array<number>;
  headers: Array<HeaderField>;
  streaming_strategy: [] | [StreamingStrategy];
  status_code: number;
}
export interface StorageBucket {
  commitUpload: ActorMethod<
    [
      {
        headers: Array<HeaderField__1>;
        chunkIds: Array<bigint>;
        batchId: bigint;
      }
    ],
    undefined
  >;
  cyclesBalance: ActorMethod<[], bigint>;
  del: ActorMethod<[{token: [] | [string]; fullPath: string}], undefined>;
  http_request: ActorMethod<[HttpRequest], HttpResponse>;
  http_request_streaming_callback: ActorMethod<
    [StreamingCallbackToken],
    StreamingCallbackHttpResponse
  >;
  initUpload: ActorMethod<[AssetKey], {batchId: bigint}>;
  list: ActorMethod<[[] | [string]], Array<AssetKey>>;
  transferFreezingThresholdCycles: ActorMethod<[], undefined>;
  uploadChunk: ActorMethod<[Chunk], {chunkId: bigint}>;
}
export interface StreamingCallbackHttpResponse {
  token: [] | [StreamingCallbackToken__1];
  body: Array<number>;
}
export interface StreamingCallbackToken {
  token: [] | [string];
  sha256: [] | [Array<number>];
  fullPath: string;
  headers: Array<HeaderField>;
  index: bigint;
}
export interface StreamingCallbackToken__1 {
  token: [] | [string];
  sha256: [] | [Array<number>];
  fullPath: string;
  headers: Array<HeaderField>;
  index: bigint;
}
export type StreamingStrategy = {
  Callback: {
    token: StreamingCallbackToken__1;
    callback: [Principal, string];
  };
};
export type UserId = Principal;
export interface _SERVICE extends StorageBucket {}
