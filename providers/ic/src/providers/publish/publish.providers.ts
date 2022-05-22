import {Deck, DeckPublish, Doc, DocPublish, PublishUrl} from '@deckdeckgo/editor';
import {_SERVICE as StorageBucketActor} from '../../canisters/storage/storage.did';
import {BucketActor} from '../../utils/manager.utils';
import {emitDeckPublished, publishDeck} from '../../utils/publish.deck.utils';
import {emitDocPublished, publishDoc} from '../../utils/publish.doc.utils';
import { publishDeckMetas, publishDocMetas } from "../../utils/publish.metas.utils";
import {uploadResources} from '../../utils/publish.resources.utils';
import {getStorageActor} from '../../utils/storage.utils';

export const deckPublish: DeckPublish = async ({
  deck
}: {
  deck: Deck;
  config: Record<string, string>;
}): Promise<Deck> => {
  await uploadResources({meta: deck.data.meta});

  const {storageUpload, publishData, deck: updatedDeck} = await publishDeck({deck});

  await publishDeckMetas({
    storageUpload,
    publishData,
    dataId: updatedDeck.id,
    owner_id: deck.data.owner_id
  });

  emitDeckPublished(updatedDeck);

  return updatedDeck;
};

export const docPublish: DocPublish = async ({
  doc,
  config
}: {
  doc: Doc;
  config: Record<string, string>;
}): Promise<Doc> => {
  await uploadResources({meta: doc.data.meta});

  const {storageUpload, publishData, doc: updatedDoc} = await publishDoc({doc, config});

  await publishDocMetas({
    storageUpload,
    publishData,
    dataId: updatedDoc.id,
    owner_id: doc.data.owner_id
  });

  emitDocPublished(updatedDoc);

  return updatedDoc;
};

export const publishUrl: PublishUrl = async () => {
  const {bucketId}: BucketActor<StorageBucketActor> = await getStorageActor();
  return `https://${bucketId.toText()}.raw.ic0.app`;
};
