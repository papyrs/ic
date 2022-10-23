import type {ActorMethod} from '@dfinity/agent';
import type {Principal} from '@dfinity/principal';

export interface AssetKey {
  token: [] | [string];
  sha256: [] | [Array<number>];
  name: string;
  fullPath: string;
  folder: string;
}
export interface Chunk {
  content: Array<number>;
  batchId: bigint;
}
export interface CommitBatch {
  headers: Array<[string, string]>;
  chunkIds: Array<bigint>;
  batchId: bigint;
}
export interface Del {
  token: [] | [string];
  fullPath: string;
}
export interface HttpRequest {
  url: string;
  method: string;
  body: Array<number>;
  headers: Array<[string, string]>;
}
export interface HttpResponse {
  body: Array<number>;
  headers: Array<[string, string]>;
  streaming_strategy: [] | [StreamingStrategy];
  status_code: number;
}
export interface InitUpload {
  batchId: bigint;
}
export interface StreamingCallbackHttpResponse {
  token: [] | [StreamingCallbackToken];
  body: Array<number>;
}
export interface StreamingCallbackToken {
  token: [] | [string];
  sha256: [] | [Array<number>];
  fullPath: string;
  headers: Array<[string, string]>;
  index: bigint;
}
export type StreamingStrategy = {
  Callback: {
    token: StreamingCallbackToken;
    callback: [Principal, string];
  };
};
export interface UploadChunk {
  chunkId: bigint;
}
export interface _SERVICE {
  commitUpload: ActorMethod<[CommitBatch], undefined>;
  cyclesBalance: ActorMethod<[], bigint>;
  del: ActorMethod<[Del], undefined>;
  http_request: ActorMethod<[HttpRequest], HttpResponse>;
  http_request_streaming_callback: ActorMethod<
    [StreamingCallbackToken],
    StreamingCallbackHttpResponse
  >;
  initUpload: ActorMethod<[AssetKey], InitUpload>;
  list: ActorMethod<[[] | [string]], Array<AssetKey>>;
  transferFreezingThresholdCycles: ActorMethod<[], undefined>;
  uploadChunk: ActorMethod<[Chunk], UploadChunk>;
}
