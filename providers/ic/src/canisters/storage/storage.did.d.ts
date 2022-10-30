import type {ActorMethod} from '@dfinity/agent';
import type {Principal} from '@dfinity/principal';

export interface AssetKey {
  token: [] | [string];
  sha256: [] | [Array<number>];
  name: string;
  full_path: string;
  folder: string;
}
export interface Chunk {
  content: Array<number>;
  batch_id: bigint;
}
export interface CommitBatch {
  batch_id: bigint;
  headers: Array<[string, string]>;
  chunk_ids: Array<bigint>;
}
export interface Del {
  token: [] | [string];
  full_path: string;
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
  batch_id: bigint;
}
export interface StreamingCallbackHttpResponse {
  token: [] | [StreamingCallbackToken];
  body: Array<number>;
}
export interface StreamingCallbackToken {
  token: [] | [string];
  sha256: [] | [Array<number>];
  headers: Array<[string, string]>;
  index: bigint;
  full_path: string;
}
export type StreamingStrategy = {
  Callback: {
    token: StreamingCallbackToken;
    callback: [Principal, string];
  };
};
export interface UploadChunk {
  chunk_id: bigint;
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
