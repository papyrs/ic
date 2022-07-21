export const idlFactory = ({ IDL }) => {
  const BlogPostStatus = IDL.Variant({
    'open' : IDL.Null,
    'accepted' : IDL.Null,
    'declined' : IDL.Null,
  });
  const FeedFilter = IDL.Record({ 'status' : IDL.Opt(BlogPostStatus) });
  const BlogPostStatus__1 = IDL.Variant({
    'open' : IDL.Null,
    'accepted' : IDL.Null,
    'declined' : IDL.Null,
  });
  const Time = IDL.Int;
  const BlogPost = IDL.Record({
    'id' : IDL.Text,
    'status' : BlogPostStatus__1,
    'updated_at' : Time,
    'meta' : IDL.Vec(IDL.Nat8),
    'storageId' : IDL.Principal,
    'created_at' : Time,
  });
  const BlogPostSubmission = IDL.Record({
    'id' : IDL.Text,
    'meta' : IDL.Vec(IDL.Nat8),
    'storageId' : IDL.Principal,
  });
  const Feed = IDL.Service({
    'accept' : IDL.Func([IDL.Principal, IDL.Text], [], []),
    'decline' : IDL.Func([IDL.Principal, IDL.Text], [], []),
    'list' : IDL.Func(
        [IDL.Opt(FeedFilter)],
        [IDL.Vec(IDL.Tuple(IDL.Text, BlogPost))],
        ['query'],
      ),
    'submit' : IDL.Func([IDL.Text, BlogPostSubmission], [], []),
  });
  return Feed;
};
export const init = ({ IDL }) => { return [IDL.Text]; };
