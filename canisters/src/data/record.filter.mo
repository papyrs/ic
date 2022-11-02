import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Array "mo:base/Array";

module {

  public type RecordFilter = {
    startsWith : ?Text;
    notContains : ?Text;
  };

  private func keyStartsWith(key : Text, startsWith : ?Text) : Bool {
    switch (startsWith) {
      case null {
        return true;
      };
      case (?startsWith) {
        return Text.startsWith(key, #text startsWith);
      };
    };
  };

  private func keyNotContains(key : Text, notContains : ?Text) : Bool {
    switch (notContains) {
      case null {
        return true;
      };
      case (?notContains) {
        return not Text.contains(key, #text notContains);
      };
    };
  };

  public func entries<T>(entries : Iter.Iter<(Text, T)>, filter : ?RecordFilter) : [(Text, T)] {
    switch (filter) {
      case null {
        return Iter.toArray(entries);
      };
      case (?filter) {
        let keyValues : [(Text, T)] = Iter.toArray(entries);

        let {startsWith; notContains} = filter;

        let values : [(Text, T)] = Array.mapFilter<(Text, T), (Text, T)>(
          keyValues,
          func((key : Text, value : T)) : ?(Text, T) {
            if (keyStartsWith(key, startsWith) and keyNotContains(key, notContains)) {
              return ?(key, value);
            };

            return null;
          }
        );

        return values;
      };
    };
  };

};
