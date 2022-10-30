export const idlFactory = ({IDL}) => {
  const UserId = IDL.Principal;
  const BucketId = IDL.Principal;
  const Bucket = IDL.Record({
    owner: UserId,
    bucketId: IDL.Opt(BucketId)
  });
  return IDL.Service({
    cyclesBalance: IDL.Func([], [IDL.Nat], ['query']),
    delData: IDL.Func([], [IDL.Bool], []),
    delStorage: IDL.Func([], [IDL.Bool], []),
    getData: IDL.Func([], [IDL.Opt(Bucket)], ['query']),
    getStorage: IDL.Func([], [IDL.Opt(Bucket)], ['query']),
    initData: IDL.Func([], [Bucket], []),
    initStorage: IDL.Func([], [Bucket], []),
    installCode: IDL.Func([IDL.Principal, IDL.Vec(IDL.Nat8), IDL.Vec(IDL.Nat8)], [], []),
    knownBucket: IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
    list: IDL.Func([IDL.Text], [IDL.Vec(Bucket)], ['query']),
    storageLoadWasm: IDL.Func(
      [IDL.Vec(IDL.Nat8)],
      [IDL.Record({total: IDL.Nat, chunks: IDL.Nat})],
      []
    ),
    storageResetWasm: IDL.Func([], [], []),
    transferCycles: IDL.Func([IDL.Principal, IDL.Nat], [], [])
  });
};
export const init = ({IDL}) => {
  return [];
};
