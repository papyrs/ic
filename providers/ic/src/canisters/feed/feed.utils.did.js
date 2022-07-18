export const idlFactory = ({IDL}) => {
  const BlogPostStatus__2 = IDL.Variant({
    open: IDL.Null,
    accepted: IDL.Null,
    declined: IDL.Null
  });
  const FeedFilter = IDL.Record({status: IDL.Opt(BlogPostStatus__2)});
  const BlogPostStatus__1 = IDL.Variant({
    open: IDL.Null,
    accepted: IDL.Null,
    declined: IDL.Null
  });
  const Time = IDL.Int;
  const BlogPost = IDL.Record({
    id: IDL.Text,
    status: BlogPostStatus__1,
    updated_at: Time,
    meta: IDL.Vec(IDL.Nat8),
    fullPath: IDL.Text,
    storageId: IDL.Principal,
    created_at: Time
  });
  const BlogPostStatus = IDL.Variant({
    open: IDL.Null,
    accepted: IDL.Null,
    declined: IDL.Null
  });
  const Feed = IDL.Service({
    accept: IDL.Func([IDL.Principal, IDL.Text], [], []),
    decline: IDL.Func([IDL.Principal, IDL.Text], [], []),
    list: IDL.Func([IDL.Opt(FeedFilter)], [IDL.Vec(IDL.Tuple(IDL.Text, BlogPost))], ['query']),
    submit: IDL.Func([IDL.Text, BlogPost], [], []),
    updateStatus: IDL.Func([IDL.Principal, IDL.Principal, IDL.Text, BlogPostStatus], [], ['oneway'])
  });
  return Feed;
};
export const init = ({IDL}) => {
  return [IDL.Text];
};
