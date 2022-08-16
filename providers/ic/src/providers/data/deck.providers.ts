import {Deck, DeckData, DeckEntries, DeleteDeck, SnapshotDeck} from '@deckdeckgo/editor';
import {entries} from '../../api/data.api';
import {deleteData} from '../../services/data.services';

export const deckEntries: DeckEntries = async (_userId: string): Promise<Deck[]> =>
  entries<DeckData>({startsWith: '/decks/', notContains: '/slides/'});

export const deleteDeck: DeleteDeck = async (
  deckId: string,
  updated_at?: Date | number | BigInt
): Promise<void> =>
  deleteData({key: `/decks/${deckId}`, ...(updated_at !== undefined && {id: deckId, updated_at})});

// Backwards compatibility with current publish mask in studio and Firebase support. In case of IC we actually do not need a snapshot, publish is synchronous on the client side.
export const snapshotDeck: SnapshotDeck = async ({
  onNext
}: {
  deckId: string;
  onNext: (snapshot: Deck) => Promise<void>;
  onError?: (error: string) => void;
}): Promise<() => void | undefined> => {
  const events = ['deckPublished', 'deckFeedSubmitted'];

  events.forEach((eventName: string) =>
    document.addEventListener(
      eventName,
      async ({detail}: CustomEvent<Deck>) => await onNext(detail),
      {passive: true}
    )
  );

  return () =>
    events.forEach((eventName: string) =>
      document.removeEventListener(
        eventName,
        ({detail}: CustomEvent<Deck>) => onNext(detail),
        false
      )
    );
};
