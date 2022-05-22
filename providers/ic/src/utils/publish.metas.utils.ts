import {Deck, Doc, log, Meta, PublishData, toDate} from '@deckdeckgo/editor';
import {_SERVICE as StorageBucketActor} from '../canisters/storage/storage.did';
import {deckEntries} from '../providers/data/deck.providers';
import {docEntries} from '../providers/data/doc.providers';
import {prepareIndexHtml} from './publish.index-html.utils';
import {prepareRSS} from './publish.rss.utils';
import {prepareSitemap} from './publish.sitemap.utils';
import {getAuthor, StorageUpload} from './publish.utils';
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
  log({msg: '[list][start] decks'});

  const decks: Deck[] = await deckEntries(owner_id);

  log({msg: '[list][start] end'});

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
  log({msg: '[list][start] docs'});

  const docs: Doc[] = await docEntries(owner_id);

  log({msg: '[list][end] docs'});

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
    publishSitemap({storageUpload, metas}),
    publishRSS({storageUpload, metas, publishData})
  ];

  await Promise.all(promises);
};

export const publishRSS = async ({
  storageUpload,
  metas,
  publishData
}: {
  storageUpload: StorageUpload;
  metas: Meta[];
  publishData: PublishData;
}): Promise<void> => {
  const {bucketUrl, actor} = storageUpload;

  const {author} = publishData;

  const rss: string = prepareRSS({bucketUrl, metas, author: author || getAuthor()});

  await uploadRSSIC({rss, actor});
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
    filename: 'sitemap.xml',
    maxAge: 3600
  });

const uploadRSSIC = async ({rss, actor}: {rss: string; actor: StorageBucketActor}): Promise<void> =>
  uploadResourceIC({
    actor,
    content: rss,
    mimeType: 'application/xml',
    fullPath: '/rss.xml',
    filename: 'rss.xml',
    maxAge: 3600
  });

const uploadResourceIC = async ({
  content,
  actor,
  mimeType,
  filename,
  fullPath,
  maxAge = 0
}: {
  content: string;
  actor: StorageBucketActor;
  mimeType: 'application/xml' | 'text/html';
  filename: string;
  fullPath: string;
  maxAge?: number;
}): Promise<void> => {
  await upload({
    data: new Blob([content], {type: mimeType}),
    filename,
    folder: 'resources',
    storageActor: actor,
    headers: [['Cache-Control', `max-age=${maxAge}`]],
    fullPath,
    log
  });
};
