export const idlFactory = ({IDL}) => {
  const UserId = IDL.Principal;
  const Time = IDL.Int;
  const DelData = IDL.Record({id: IDL.Text, updated_at: Time});
  const DelInteraction = IDL.Record({id: IDL.Text, updated_at: Time});
  const Data = IDL.Record({
    id: IDL.Text,
    updated_at: Time,
    data: IDL.Vec(IDL.Nat8),
    created_at: Time
  });
  const Interaction = IDL.Record({
    id: IDL.Text,
    updated_at: Time,
    data: IDL.Vec(IDL.Nat8),
    created_at: Time,
    author: UserId
  });
  const RecordFilter = IDL.Record({
    notContains: IDL.Opt(IDL.Text),
    startsWith: IDL.Opt(IDL.Text)
  });
  const PutData = IDL.Record({
    id: IDL.Text,
    updated_at: IDL.Opt(Time),
    data: IDL.Vec(IDL.Nat8),
    created_at: IDL.Opt(Time)
  });
  const PutInteraction = IDL.Record({
    id: IDL.Text,
    updated_at: IDL.Opt(Time),
    data: IDL.Vec(IDL.Nat8),
    created_at: IDL.Opt(Time),
    author: UserId
  });
  const DataBucket = IDL.Service({
    countLikes: IDL.Func([IDL.Text], [IDL.Nat], ['query']),
    cyclesBalance: IDL.Func([], [IDL.Nat], ['query']),
    del: IDL.Func([IDL.Text], [], []),
    delete: IDL.Func([IDL.Text, DelData], [], []),
    deleteInteraction: IDL.Func([IDL.Text, DelInteraction], [], []),
    get: IDL.Func([IDL.Text], [IDL.Opt(Data)], ['query']),
    getComment: IDL.Func([IDL.Text, IDL.Text], [IDL.Opt(Interaction)], ['query']),
    getLike: IDL.Func([IDL.Text], [IDL.Opt(Interaction)], ['query']),
    list: IDL.Func([IDL.Opt(RecordFilter)], [IDL.Vec(IDL.Tuple(IDL.Text, Data))], ['query']),
    listComments: IDL.Func([IDL.Text], [IDL.Vec(IDL.Tuple(IDL.Text, Interaction))], ['query']),
    listInteractions: IDL.Func(
      [IDL.Vec(IDL.Text)],
      [
        IDL.Vec(
          IDL.Tuple(
            IDL.Text,
            IDL.Record({
              countComments: IDL.Nat,
              countLikes: IDL.Nat,
              like: IDL.Opt(Interaction)
            })
          )
        )
      ],
      ['query']
    ),
    put: IDL.Func([IDL.Text, PutData], [Data], []),
    putInteraction: IDL.Func([IDL.Text, PutInteraction], [Interaction], []),
    set: IDL.Func([IDL.Text, Data], [], []),
    transferFreezingThresholdCycles: IDL.Func([], [], [])
  });
  return DataBucket;
};
export const init = ({IDL}) => {
  const UserId = IDL.Principal;
  return [UserId];
};
