import {Deck, Doc, log, Meta, PublishData, toDate} from '@deckdeckgo/editor';
import {_SERVICE as StorageBucketActor} from '../canisters/storage/storage.did';
import {deckEntries} from '../providers/data/deck.providers';
import {docEntries} from '../providers/data/doc.providers';
import {prepareIndexHtml} from './publish.index-html.utils';
import {StorageUpload} from './publish.utils';
import {upload} from './storage.utils';

export const publishDeckMetas = async ({
  owner_id,
  dataId,
  storageUpload,
  publishData
}: {
  owner_id: string;
  dataId: string;
  storageUpload: StorageUpload;
  publishData: PublishData;
}): Promise<void> => {
  const decks: Deck[] = await deckEntries(owner_id);

  const metas: Meta[] = mapMetas(decks);

  await publishIndexHtml({storageUpload, publishData, dataId, metas});
};

export const publishDocMetas = async ({
  owner_id,
  dataId,
  storageUpload,
  publishData
}: {
  owner_id: string;
  dataId: string;
  storageUpload: StorageUpload;
  publishData: PublishData;
}): Promise<void> => {
  const docs: Doc[] = await docEntries(owner_id);

  const metas: Meta[] = mapMetas(docs);

  await publishIndexHtml({storageUpload, publishData, dataId, metas});
};

const mapMetas = (entries: (Doc | Deck)[]): Meta[] =>
  entries
    .filter(({data}: Doc | Deck) => data.meta?.published === true)
    .map(({data}: Doc | Deck) => data.meta)
    .sort(
      ({published_at: published_at_a}: Meta, {published_at: published_at_b}: Meta) =>
        (toDate(published_at_b)?.getTime() || 0) - (toDate(published_at_a)?.getTime() || 0)
    );

export const publishIndexHtml = async ({
  dataId,
  storageUpload,
  publishData,
  metas
}: {
  dataId: string;
  storageUpload: StorageUpload;
  publishData: PublishData;
  metas: Meta[];
}): Promise<void> => {
  const {bucketUrl, actor} = storageUpload;

  const html: string = await prepareIndexHtml({dataId, bucketUrl, publishData, metas});

  await uploadOverviewIC({html, actor});
};

const uploadOverviewIC = async ({
  html,
  actor
}: {
  html: string;
  actor: StorageBucketActor;
}): Promise<void> => {
  await upload({
    data: new Blob([html], {type: 'text/html'}),
    filename: 'index.html',
    folder: 'resources',
    storageActor: actor,
    headers: [['Cache-Control', 'max-age=0']],
    fullPath: '/',
    log
  });
};
