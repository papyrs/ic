import {Deck, DeckPublish, Doc, DocPublish, PublishUrl, UpdateLanding} from '@deckdeckgo/editor';
import {Identity} from '@dfinity/agent';
import {getDataBucketActor} from '../../api/data.api';
import {getStorageActor} from '../../api/storage.api';
import {_SERVICE as StorageBucketActor} from '../../canisters/storage/storage.did';
import {emitDeckPublished, publishDeck} from '../../publish/deck.publish';
import {emitDocPublished, publishDoc} from '../../publish/doc.publish';
import {publishDeckMetas, publishDocMetas, updateIndexHtml} from '../../publish/metas.publish';
import {uploadResources} from '../../publish/resources.publish';
import {EnvStore} from '../../stores/env.store';
import {PublishCanisterIds} from '../../types/publish.types';
import {BucketActor} from '../../utils/manager.utils';
import {getIdentity} from '../auth/auth.providers';

export const deckPublish: DeckPublish = async ({
  deck
}: {
  deck: Deck;
  config: Record<string, string>;
}): Promise<Deck> => {
  const canisterIds: PublishCanisterIds = await getCanisterIds();

  await uploadResources({
    meta: deck.data.meta,
    ids: {
      ...canisterIds,
      data_id: deck.id
    }
  });

  const {storageUpload, publishData, deck: updatedDeck} = await publishDeck({deck, canisterIds});

  await publishDeckMetas({
    storageUpload,
    publishData,
    owner_id: deck.data.owner_id,
    canisterIds
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
  const canisterIds: PublishCanisterIds = await getCanisterIds();

  await uploadResources({
    meta: doc.data.meta,
    ids: {
      ...canisterIds,
      data_id: doc.id
    }
  });

  const {
    storageUpload,
    publishData,
    doc: updatedDoc
  } = await publishDoc({doc, config, canisterIds});

  await publishDocMetas({
    storageUpload,
    publishData,
    owner_id: doc.data.owner_id,
    canisterIds
  });

  emitDocPublished(updatedDoc);

  return updatedDoc;
};

const getCanisterIds = async (): Promise<PublishCanisterIds> => {
  const [{bucketId: dataBucketId}, {bucketId: storageBucketId}] = await Promise.all([
    getDataBucketActor(),
    getStorageActor()
  ]);

  return {
    data_canister_id: dataBucketId.toText(),
    storage_canister_id: storageBucketId.toText()
  };
};

export const publishUrl: PublishUrl = async (): Promise<string> => {
  const {bucketId}: BucketActor<StorageBucketActor> = await getStorageActor();

  if (EnvStore.getInstance().localIdentity()) {
    return `http://${bucketId.toText()}.localhost:8000`;
  }

  return `https://${bucketId.toText()}.raw.icp0.io`;
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
