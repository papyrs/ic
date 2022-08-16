export const idlFactory = ({IDL}) => {
  const UserId = IDL.Principal;
  const Time = IDL.Int;
  const DelData = IDL.Record({id: IDL.Text, updated_at: Time});
  const Data = IDL.Record({
    id: IDL.Text,
    updated_at: Time,
    data: IDL.Vec(IDL.Nat8),
    created_at: Time
  });
  const DataFilter = IDL.Record({
    notContains: IDL.Opt(IDL.Text),
    startsWith: IDL.Opt(IDL.Text)
  });
  const PutData = IDL.Record({
    id: IDL.Text,
    updated_at: IDL.Opt(Time),
    data: IDL.Vec(IDL.Nat8),
    created_at: IDL.Opt(Time)
  });
  const DataBucket = IDL.Service({
    cyclesBalance: IDL.Func([], [IDL.Nat], ['query']),
    del: IDL.Func([IDL.Text], [], []),
    delete: IDL.Func([IDL.Text, DelData], [], []),
    get: IDL.Func([IDL.Text], [IDL.Opt(Data)], ['query']),
    list: IDL.Func([IDL.Opt(DataFilter)], [IDL.Vec(IDL.Tuple(IDL.Text, Data))], ['query']),
    put: IDL.Func([IDL.Text, PutData], [Data], []),
    set: IDL.Func([IDL.Text, Data], [], []),
    transferFreezingThresholdCycles: IDL.Func([], [], [])
  });
  return DataBucket;
};
export const init = ({IDL}) => {
  const UserId = IDL.Principal;
  return [UserId];
};
