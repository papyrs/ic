export const idlFactory = ({IDL}) => {
  const definite_canister_settings = IDL.Record({
    freezing_threshold: IDL.Nat,
    controllers: IDL.Opt(IDL.Vec(IDL.Principal)),
    memory_allocation: IDL.Nat,
    compute_allocation: IDL.Nat
  });
  const CanisterStatus = IDL.Record({
    status: IDL.Variant({
      stopped: IDL.Null,
      stopping: IDL.Null,
      running: IDL.Null
    }),
    memory_size: IDL.Nat,
    cycles: IDL.Nat,
    settings: definite_canister_settings,
    module_hash: IDL.Opt(IDL.Vec(IDL.Nat8))
  });
  const UserId = IDL.Principal;
  const BucketId = IDL.Principal;
  const Bucket = IDL.Record({
    owner: UserId,
    bucketId: IDL.Opt(BucketId)
  });
  return IDL.Service({
    delData: IDL.Func([], [IDL.Bool], []),
    delStorage: IDL.Func([], [IDL.Bool], []),
    getCanistersStatus: IDL.Func(
      [],
      [IDL.Record({data: CanisterStatus, storage: CanisterStatus})],
      []
    ),
    getData: IDL.Func([], [IDL.Opt(Bucket)], ['query']),
    getStorage: IDL.Func([], [IDL.Opt(Bucket)], ['query']),
    initData: IDL.Func([], [Bucket], []),
    initStorage: IDL.Func([], [Bucket], []),
    installCode: IDL.Func([IDL.Principal, IDL.Vec(IDL.Nat8), IDL.Vec(IDL.Nat8)], [], []),
    list: IDL.Func([IDL.Text], [IDL.Vec(Bucket)], ['query'])
  });
};
export const init = ({IDL}) => {
  return [];
};
