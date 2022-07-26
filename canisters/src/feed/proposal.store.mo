import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Result "mo:base/Result";

import IC "../types/ic.types";

import Store "../stores/store";

import ProposalFilter "./proposal.filter";
import ProposalTypes "./proposal.types";

module {
    type ProposalFilter = ProposalFilter.ProposalFilter;

    type Proposal = ProposalTypes.Proposal;
    type ProposalStatus = ProposalTypes.ProposalStatus;
    type ProposalEntry = ProposalTypes.ProposalEntry;

    type CanisterId = IC.canister_id;

    public class ProposalStore() {
        private let store: Store.Store<ProposalEntry> = Store.Store<ProposalEntry>();

        public func submit(proposal: Proposal) {
            let post: ProposalEntry = initEntry(proposal);

            let {storageId; id} = proposal;

            let entry: ?ProposalEntry = get(storageId, id);

            switch (entry) {
                case (?entry) {
                    // We only put proposal if it was never submitted otherwise we silenty ignore the entry because it has already been submitted. We do not want to crash the frontend it it happens.
                };
                case (null) {
                    put(post.proposal, post);
                };
            };
        };

        public func updateStatus(storageId: CanisterId, id: Text, status: ProposalStatus): Result.Result<Text, Text> {
            let entry: ?ProposalEntry = get(storageId, id);

            switch (entry) {
                case (?entry) {
                    let updatedEntry: ProposalEntry = cloneToStatus(entry, status);
                    put(entry.proposal, updatedEntry);

                    return #ok "Proposal status updated";
                };
                case (null) {
                    #err "Status cannot be updated, proposal does not exist"
                };
            };
        };

        private func put({storageId; id;}: Proposal, value: ProposalEntry) {
            let key: Text = toKey(storageId, id);
            store.put(key, value);
        };

        public func get(storageId: CanisterId, id: Text): ?ProposalEntry {
            let key: Text = toKey(storageId, id);
            return store.get(key);
        };

        public func entries(filter: ?ProposalFilter): [(Text, ProposalEntry)] {
            let entries: Iter.Iter<(Text, ProposalEntry)> = store.entries();

            switch (filter) {
                case null {
                    return Iter.toArray(entries);
                };
                case (?filter) {
                    let keyValues: [(Text, ProposalEntry)] = Iter.toArray(entries);

                    let {status} = filter;

                    let values: [(Text, ProposalEntry)] = Array.mapFilter<(Text, ProposalEntry), (Text, ProposalEntry)>(keyValues, func ((key: Text, value: ProposalEntry)) : ?(Text, ProposalEntry) {
                        if (ProposalFilter.matchStatus(value, status)) {
                            return ?(key, value);
                        };

                        return null;
                    });


                    return values;
                };
            };
        };

        private func toKey(storageId: CanisterId, id: Text): Text {
            Principal.toText(storageId) # "___" # id
        };

        private func initEntry(proposal: Proposal): ProposalEntry {
            let now: Time.Time = Time.now();

            return {
                proposal = proposal;
                status = #open;
                created_at = now;
                updated_at = now;
            };
        };

        private func cloneToStatus(entry: ProposalEntry, status: ProposalStatus): ProposalEntry {
            {
                proposal = entry.proposal;
                status;
                created_at = entry.created_at;
                updated_at = Time.now();
            };
        };

        public func preupgrade(): HashMap.HashMap<Text, ProposalEntry> {
            return store.preupgrade();
        };

        public func postupgrade(stableData: [(Text, ProposalEntry)]) {
            store.postupgrade(stableData);
        };
    }
}
