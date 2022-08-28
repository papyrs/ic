import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Time "mo:base/Time";

import IC "../types/ic.types";

import Store "../stores/store";

import PostFilter "./post.filter";
import PostTypes "./post.types";

import ProposalTypes "./proposal.types";

module {
  type PostFilter = PostFilter.PostFilter;

  type Post = PostTypes.Post;

  type Proposal = ProposalTypes.Proposal;

  type CanisterId = IC.canister_id;

  public class PostStore() {
    private let store : Store.Store<Post> = Store.Store<Post>();

    public func add(proposal : Proposal) {
      let now : Time.Time = Time.now();

      let post : Post = {
        id = proposal.id;
        storageId = proposal.storageId;
        pathname = proposal.pathname;
        meta = proposal.meta;

        created_at = now;
        updated_at = now;
      };

      store.put(toKey(post.storageId, post.id), post);
    };

    public func entries(filter : ?PostFilter) : [(Text, Post)] {
      let entries : Iter.Iter<(Text, Post)> = store.entries();

      switch (filter) {
        case null {
          return Iter.toArray(entries);
        };
        case (?filter) {
          let keyValues : [(Text, Post)] = Iter.toArray(entries);

          let {storageId} = filter;

          let values : [(Text, Post)] = Array.mapFilter<(Text, Post), (Text, Post)>(
            keyValues,
            func((key : Text, value : Post)) : ?(Text, Post) {
              if (PostFilter.matchStorage(value, storageId)) {
                return ?(key, value);
              };

              return null;
            }
          );

          return values;
        };
      };
    };

    public func del(storageId : Principal, id : Text) : ?Post {
      return store.del(toKey(storageId, id));
    };

    private func toKey(storageId : Principal, id : Text) : Text {
      Principal.toText(storageId) # "___" # id;
    };

    public func preupgrade() : HashMap.HashMap<Text, Post> {
      return store.preupgrade();
    };

    public func postupgrade(stableData : [(Text, Post)]) {
      store.postupgrade(stableData);
    };
  };
};
