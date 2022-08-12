import {Deck, DeckPublish, Doc, DocPublish, PublishUrl, UpdateLanding} from '@deckdeckgo/editor';
import {Identity} from '@dfinity/agent';
import {_SERVICE as StorageBucketActor} from '../../canisters/storage/storage.did';
import {EnvStore} from '../../stores/env.store';
import {BucketActor} from '../../utils/manager.utils';
import {emitDeckPublished, publishDeck} from '../../publish/deck.publish';
import {emitDocPublished, publishDoc} from '../../publish/doc.publish';
import {publishDeckMetas, publishDocMetas, updateIndexHtml} from '../../publish/metas.publish';
import {uploadResources} from '../../publish/resources.publish';
import {getStorageActor} from '../../utils/storage.utils';
import {getIdentity} from '../auth/auth.providers';

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
    owner_id: doc.data.owner_id
  });

  emitDocPublished(updatedDoc);

  return updatedDoc;
};

export const publishUrl: PublishUrl = async (): Promise<string> => {
  const {bucketId}: BucketActor<StorageBucketActor> = await getStorageActor();

  if (EnvStore.getInstance().localIdentity()) {
    return `http://${bucketId.toText()}.localhost:8000`;
  }

  return `https://${bucketId.toText()}.raw.ic0.app`;
};

export const updateLanding: UpdateLanding = async (): Promise<void> => {
  const identity: Identity | undefined = getIdentity();

  if (!identity) {
    throw new Error(
      'No internet identity provided to list the entries that should be listed on the landing page'
    );
  }

  const bucketUrl: string = await publishUrl();

  await updateIndexHtml({bucketUrl, identity});
};
