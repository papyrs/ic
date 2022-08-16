import {DeleteDoc, Doc, DocData, DocEntries, SnapshotDoc} from '@deckdeckgo/editor';
import {entries} from '../../api/data.api';
import {deleteData} from '../../services/data.services';

export const docEntries: DocEntries = async (_userId: string): Promise<Doc[]> =>
  entries<DocData>({startsWith: '/docs/', notContains: '/paragraphs/'});

export const deleteDoc: DeleteDoc = async (
  docId: string,
  updated_at?: Date | number | BigInt
): Promise<void> =>
  deleteData({key: `/docs/${docId}`, ...(updated_at !== undefined && {id: docId, updated_at})});

// Backwards compatibility with current publish mask in studio and Firebase support. In case of IC we actually do not need a snapshot, publish is synchronous on the client side.
export const snapshotDoc: SnapshotDoc = async ({
  onNext
}: {
  docId: string;
  onNext: (snapshot: Doc) => Promise<void>;
  onError?: (error: string) => void;
}): Promise<() => void | undefined> => {
  const events = ['docPublished', 'docFeedSubmitted'];

  events.forEach((eventName: string) =>
    document.addEventListener(
      eventName,
      async ({detail}: CustomEvent<Doc>) => await onNext(detail),
      {passive: true}
    )
  );

  return () =>
    events.forEach((eventName: string) =>
      document.removeEventListener(
        eventName,
        async ({detail}: CustomEvent<Doc>) => await onNext(detail),
        false
      )
    );
};
