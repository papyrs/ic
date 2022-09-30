import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Int "mo:base/Int";

import Store "../stores/store";

import Filter "./record.filter";

import InteractionTypes "./interaction.types";
import Types "../types/types";

import RecordUtils "./record.utils";
import InteractionUtils "./interaction.utils";

module {
  type RecordFilter = Filter.RecordFilter;

  type Interaction = InteractionTypes.Interaction;
  type PutInteraction = InteractionTypes.PutInteraction;
  type DelInteraction = InteractionTypes.DelInteraction;
  type InteractionUsers = InteractionTypes.InteractionUsers;

  type UserId = Types.UserId;

  public class InteractionStore() {
    private let store : Store.Store<Interaction> = Store.Store<Interaction>();

    public func put(key : Text, putInteraction : PutInteraction, {caller; user} : InteractionUsers) : Result.Result<Interaction, Text> {
      let record : ?Interaction = get(key);

      switch (record) {
        case null {
          let newInteraction : Interaction = create(key, putInteraction, caller);
          return #ok newInteraction;
        };
        case (?record) {
          return update(key, record, putInteraction, {caller; user});
        };
      };
    };

    private func update(
      key : Text,
      record : Interaction,
      putInteraction : PutInteraction,
      users : InteractionUsers
    ) : Result.Result<Interaction, Text> {

      let validCaller : Result.Result<Text, Text> = InteractionUtils.isValidCaller(
        record,
        users
      );

      // Only valid caller - the author of the interaction or the owner of the canister - can edit an interaction
      switch (validCaller) {
        case (#err error) {
          return #err error;
        };
        case (#ok text) {
          let {id; data; updated_at; author} = putInteraction;

          switch (updated_at) {
            case null {
              return #err "Cannot update an interaction without updated_at timestamp.";
            };
            case (?updated_at) {
              let timestamp : Result.Result<Text, Text> = RecordUtils.checkTimestamp(
                record,
                id,
                updated_at
              );

              // Only the last current timestamp can be edited
              switch (timestamp) {
                case (#err error) {
                  return #err error;
                };
                case (#ok text) {
                  let now : Time.Time = Time.now();

                  let updateInteraction : Interaction = {
                    id;
                    data;
                    author = record.author;
                    created_at = record.created_at;
                    updated_at = now;
                  };

                  store.put(key, updateInteraction);

                  return #ok updateInteraction;
                };
              };
            };
          };
        };
      };
    };

    private func create(key : Text, {id; data} : PutInteraction, author : UserId) : Interaction {
      let now : Time.Time = Time.now();

      let newInteraction : Interaction = {
        id;
        data;
        author;
        created_at = now;
        updated_at = now;
      };

      store.put(key, newInteraction);

      return newInteraction;
    };

    public func get(key : Text) : ?Interaction {
      return store.get(key);
    };

    public func getProctected(key : Text, users : InteractionUsers) : Result.Result<?Interaction, Text> {
      let record : ?Interaction = get(key);

      switch (record) {
        case (null) {
          return #ok null;
        };
        case (?record) {
          let validCaller : Result.Result<Text, Text> = InteractionUtils.isValidCaller(
            record,
            users
          );

          // Only valid caller - the author of the interaction or the owner of the canister - can edit an interaction
          switch (validCaller) {
            case (#err error) {
              return #err error;
            };
            case (#ok msg) {
              return #ok (?record);
            };
          };
        };
      };
    };

    public func del(key : Text, {id; updated_at} : DelInteraction, users : InteractionUsers) : Result.Result<?Interaction, Text> {
      let record : ?Interaction = get(key);

      switch (record) {
        case null {
          // The function does not throw an error if data does not exists because a paragraph might have been created offline, never sync but still added to the list of deleted paragraphs to sync
          return #ok null;
        };
        case (?record) {
          // Only a valid caller can delete an interaction
          let validCaller : Result.Result<Text, Text> = InteractionUtils.isValidCaller(
            record,
            users
          );

          switch (validCaller) {
            case (#err error) {
              return #err error;
            };
            case (#ok text) {
              let timestamp : Result.Result<Text, Text> = RecordUtils.checkTimestamp(
                record,
                id,
                updated_at
              );

              // Only the very last interaction with the most recent timestamp can be deleted
              switch (timestamp) {
                case (#err error) {
                  return #err error;
                };
                case (#ok text) {
                  let result : ?Interaction = store.del(key);
                  return #ok result;
                };
              };
            };
          };
        };
      };
    };

    public func entries(filter : ?RecordFilter) : [(Text, Interaction)] {
      return Filter.entries<Interaction>(store.entries(), filter);
    };

    public func preupgrade() : HashMap.HashMap<Text, Interaction> {
      return store.preupgrade();
    };

    public func postupgrade(stableInteraction : [(Text, Interaction)]) {
      store.postupgrade(stableInteraction);
    };
  };
};
