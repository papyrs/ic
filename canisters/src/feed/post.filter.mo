import IC "../types/ic.types";

import PostTypes "./post.types";

module {

  type Post = PostTypes.Post;

  public type PostFilter = {
    storageId : ?IC.canister_id;
  };

  public func matchStorage(post : Post, storageId : ?IC.canister_id) : Bool {
    switch (storageId) {
      case null {
        return true;
      };
      case (?storageId) {
        return post.storageId == storageId;
      };
    };
  };

};
