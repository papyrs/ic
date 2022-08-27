import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";

module {
  public class Store<T>() {
    private var data : HashMap.HashMap<Text, T> = HashMap.HashMap<Text, T>(
      10,
      Text.equal,
      Text.hash
    );

    public func put(key : Text, value : T) {
      data.put(key, value);
    };

    public func get(key : Text) : ?T {
      return data.get(key);
    };

    public func del(key : Text) : ?T {
      let entry : ?T = get(key);

      switch (entry) {
        case (?entry) {
          data.delete(key);
        };
        case (null) {};
      };

      return entry;
    };

    public func entries() : Iter.Iter<(Text, T)> {
      return data.entries();
    };

    public func preupgrade() : HashMap.HashMap<Text, T> {
      return data;
    };

    public func postupgrade(stableData : [(Text, T)]) {
      data := HashMap.fromIter<Text, T>(stableData.vals(), 10, Text.equal, Text.hash);
    };
  };
};
