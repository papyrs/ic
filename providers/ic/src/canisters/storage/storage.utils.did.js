export const idlFactory = ({IDL}) => {
  const CommitBatch = IDL.Record({
    batch_id: IDL.Nat,
    headers: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    chunk_ids: IDL.Vec(IDL.Nat)
  });
  const Del = IDL.Record({
    token: IDL.Opt(IDL.Text),
    full_path: IDL.Text
  });
  const HttpRequest = IDL.Record({
    url: IDL.Text,
    method: IDL.Text,
    body: IDL.Vec(IDL.Nat8),
    headers: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))
  });
  const StreamingCallbackToken = IDL.Record({
    token: IDL.Opt(IDL.Text),
    sha256: IDL.Opt(IDL.Vec(IDL.Nat8)),
    headers: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    index: IDL.Nat64,
    full_path: IDL.Text
  });
  const StreamingStrategy = IDL.Variant({
    Callback: IDL.Record({
      token: StreamingCallbackToken,
      callback: IDL.Func([], [], [])
    })
  });
  const HttpResponse = IDL.Record({
    body: IDL.Vec(IDL.Nat8),
    headers: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    streaming_strategy: IDL.Opt(StreamingStrategy),
    status_code: IDL.Nat16
  });
  const StreamingCallbackHttpResponse = IDL.Record({
    token: IDL.Opt(StreamingCallbackToken),
    body: IDL.Vec(IDL.Nat8)
  });
  const AssetKey = IDL.Record({
    token: IDL.Opt(IDL.Text),
    sha256: IDL.Opt(IDL.Vec(IDL.Nat8)),
    name: IDL.Text,
    full_path: IDL.Text,
    folder: IDL.Text
  });
  const InitUpload = IDL.Record({batch_id: IDL.Nat});
  const Chunk = IDL.Record({
    content: IDL.Vec(IDL.Nat8),
    batch_id: IDL.Nat
  });
  const UploadChunk = IDL.Record({chunk_id: IDL.Nat});
  return IDL.Service({
    commitUpload: IDL.Func([CommitBatch], [], []),
    cyclesBalance: IDL.Func([], [IDL.Nat], ['query']),
    del: IDL.Func([Del], [], []),
    http_request: IDL.Func([HttpRequest], [HttpResponse], ['query']),
    http_request_streaming_callback: IDL.Func(
      [StreamingCallbackToken],
      [StreamingCallbackHttpResponse],
      ['query']
    ),
    initUpload: IDL.Func([AssetKey], [InitUpload], []),
    list: IDL.Func([IDL.Opt(IDL.Text)], [IDL.Vec(AssetKey)], ['query']),
    transferFreezingThresholdCycles: IDL.Func([], [], []),
    uploadChunk: IDL.Func([Chunk], [UploadChunk], [])
  });
};
export const init = ({IDL}) => {
  return [];
};
