export const idlFactory = ({IDL}) => {
  const canister_id = IDL.Principal;
  const PostFilter = IDL.Record({storageId: IDL.Opt(canister_id)});
  const Time = IDL.Int;
  const Post = IDL.Record({
    id: IDL.Text,
    updated_at: Time,
    meta: IDL.Vec(IDL.Nat8),
    storageId: canister_id,
    created_at: Time
  });
  const ProposalStatus = IDL.Variant({
    open: IDL.Null,
    accepted: IDL.Null,
    declined: IDL.Null
  });
  const ProposalFilter = IDL.Record({status: IDL.Opt(ProposalStatus)});
  const ProposalStatus__1 = IDL.Variant({
    open: IDL.Null,
    accepted: IDL.Null,
    declined: IDL.Null
  });
  const Proposal__1 = IDL.Record({
    id: IDL.Text,
    meta: IDL.Vec(IDL.Nat8),
    storageId: canister_id
  });
  const ProposalEntry = IDL.Record({
    status: ProposalStatus__1,
    updated_at: Time,
    created_at: Time,
    proposal: Proposal__1
  });
  const Proposal = IDL.Record({
    id: IDL.Text,
    meta: IDL.Vec(IDL.Nat8),
    storageId: canister_id
  });
  const Feed = IDL.Service({
    accept: IDL.Func([IDL.Principal, IDL.Text], [], []),
    decline: IDL.Func([IDL.Principal, IDL.Text], [], []),
    list: IDL.Func([IDL.Opt(PostFilter)], [IDL.Vec(IDL.Tuple(IDL.Text, Post))], []),
    listProposals: IDL.Func(
      [IDL.Opt(ProposalFilter)],
      [IDL.Vec(IDL.Tuple(IDL.Text, ProposalEntry))],
      ['query']
    ),
    submit: IDL.Func([IDL.Text, Proposal], [], [])
  });
  return Feed;
};
export const init = ({IDL}) => {
  return [IDL.Text];
};
