import {Deck, Doc, log, Meta, PublishData, toDate} from '@deckdeckgo/editor';
import {_SERVICE as StorageBucketActor} from '../canisters/storage/storage.did';
import {deckEntries} from '../providers/data/deck.providers';
import {docEntries} from '../providers/data/doc.providers';
import {prepareIndexHtml} from './publish.index-html.utils';
import {prepareSitemap} from './publish.sitemap.utils';
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

  await publishMetas({storageUpload, publishData, dataId, entries: decks});
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

  await publishMetas({storageUpload, publishData, dataId, entries: docs});
};

const mapMetas = (entries: (Doc | Deck)[]): Meta[] =>
  entries
    .filter(({data}: Doc | Deck) => data.meta?.published === true)
    .map(({data}: Doc | Deck) => data.meta)
    .sort(
      ({published_at: published_at_a}: Meta, {published_at: published_at_b}: Meta) =>
        (toDate(published_at_b)?.getTime() || 0) - (toDate(published_at_a)?.getTime() || 0)
    );

const publishMetas = async ({
  dataId,
  storageUpload,
  publishData,
  entries
}: {
  dataId: string;
  storageUpload: StorageUpload;
  publishData: PublishData;
  entries: (Doc | Deck)[];
}): Promise<void> => {
  const metas: Meta[] = mapMetas(entries);

  const promises: Promise<void>[] = [
    publishIndexHtml({storageUpload, publishData, dataId, metas}),
    publishSitemap({storageUpload, metas})
  ]

  await Promise.all(promises);
};

export const publishSitemap = async ({
  storageUpload,
  metas
}: {
  storageUpload: StorageUpload;
  metas: Meta[];
}): Promise<void> => {
  const {bucketUrl, actor} = storageUpload;

  const sitemap: string = prepareSitemap({bucketUrl, metas});

  await uploadSitemapIC({sitemap, actor});
};

const publishIndexHtml = async ({
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

  await uploadIndexHtmlIC({html, actor});
};

const uploadIndexHtmlIC = async ({
  html,
  actor
}: {
  html: string;
  actor: StorageBucketActor;
}): Promise<void> =>
  uploadResourceIC({
    actor,
    content: html,
    mimeType: 'text/html',
    fullPath: '/',
    filename: 'index.html'
  });

const uploadSitemapIC = async ({
  sitemap,
  actor
}: {
  sitemap: string;
  actor: StorageBucketActor;
}): Promise<void> =>
  uploadResourceIC({
    actor,
    content: sitemap,
    mimeType: 'application/xml',
    fullPath: '/sitemap.xml',
    filename: 'sitemap.xml'
  });

const uploadResourceIC = async ({
  content,
  actor,
  mimeType,
  filename,
  fullPath
}: {
  content: string;
  actor: StorageBucketActor;
  mimeType: 'application/xml' | 'text/html';
  filename: string;
  fullPath: string;
}): Promise<void> => {
  await upload({
    data: new Blob([content], {type: mimeType}),
    filename,
    folder: 'resources',
    storageActor: actor,
    headers: [['Cache-Control', 'max-age=0']],
    fullPath,
    log
  });
};
