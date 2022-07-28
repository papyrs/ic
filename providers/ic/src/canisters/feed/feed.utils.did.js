export const idlFactory = ({IDL}) => {
  const canister_id = IDL.Principal;
  const PostFilter = IDL.Record({storageId: IDL.Opt(canister_id)});
  const Time = IDL.Int;
  const ProposalAuthorSocial = IDL.Record({
    linkedin: IDL.Opt(IDL.Text),
    twitter: IDL.Opt(IDL.Text),
    custom: IDL.Opt(IDL.Text),
    github: IDL.Opt(IDL.Text)
  });
  const ProposalAuthor = IDL.Record({
    bio: IDL.Opt(IDL.Text),
    photo_url: IDL.Opt(IDL.Text),
    social: IDL.Opt(ProposalAuthorSocial),
    name: IDL.Text
  });
  const ProposalMeta = IDL.Record({
    title: IDL.Text,
    tags: IDL.Opt(IDL.Vec(IDL.Text)),
    description: IDL.Opt(IDL.Text),
    author: IDL.Opt(ProposalAuthor)
  });
  const Post = IDL.Record({
    id: IDL.Text,
    updated_at: Time,
    meta: ProposalMeta,
    pathname: IDL.Text,
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
    meta: ProposalMeta,
    pathname: IDL.Text,
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
    meta: ProposalMeta,
    pathname: IDL.Text,
    storageId: canister_id
  });
  const Feed = IDL.Service({
    accept: IDL.Func([IDL.Principal, IDL.Text], [], []),
    decline: IDL.Func([IDL.Principal, IDL.Text], [], []),
    del: IDL.Func([IDL.Principal, IDL.Text], [], []),
    list: IDL.Func([IDL.Opt(PostFilter)], [IDL.Vec(IDL.Tuple(IDL.Text, Post))], ['query']),
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
