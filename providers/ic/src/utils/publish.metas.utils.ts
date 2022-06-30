import {Deck, Doc, log, PublishData, toDate} from '@deckdeckgo/editor';
import {_SERVICE as StorageBucketActor} from '../canisters/storage/storage.did';
import {deckEntries} from '../providers/data/deck.providers';
import {docEntries} from '../providers/data/doc.providers';
import {PublishMeta} from '../types/publish.metas';
import {prepareIndexHtml} from './publish.index-html.utils';
import {prepareRSS} from './publish.rss.utils';
import {prepareSitemap} from './publish.sitemap.utils';
import {getAuthor, StorageUpload} from './publish.utils';
import {upload} from './storage.utils';

export const publishDeckMetas = async ({
  owner_id,
  storageUpload,
  publishData
}: {
  owner_id: string;
  storageUpload: StorageUpload;
  publishData: PublishData;
}): Promise<void> => {
  log({msg: '[list][start] decks'});

  const decks: Deck[] = await deckEntries(owner_id);

  log({msg: '[list][start] end'});

  await publishMetas({storageUpload, publishData, entries: decks});
};

export const publishDocMetas = async ({
  owner_id,
  storageUpload,
  publishData
}: {
  owner_id: string;
  storageUpload: StorageUpload;
  publishData: PublishData;
}): Promise<void> => {
  log({msg: '[list][start] docs'});

  const docs: Doc[] = await docEntries(owner_id);

  log({msg: '[list][end] docs'});

  await publishMetas({storageUpload, publishData, entries: docs});
};

const sortEntries = (entries: (Doc | Deck)[]): PublishMeta[] =>
  entries
    .filter(({data}: Doc | Deck) => data.meta?.published === true)
    .sort(
      (
        {
          data: {
            meta: {published_at: published_at_a}
          }
        }: Doc | Deck,
        {
          data: {
            meta: {published_at: published_at_b}
          }
        }: Doc | Deck
      ) => (toDate(published_at_b)?.getTime() || 0) - (toDate(published_at_a)?.getTime() || 0)
    )
    .map(({id, data: {meta}}: Doc | Deck) => ({
      dataId: id,
      meta
    }));

const publishMetas = async ({
  storageUpload,
  publishData,
  entries
}: {
  storageUpload: StorageUpload;
  publishData: PublishData;
  entries: (Doc | Deck)[];
}): Promise<void> => {
  const metas: PublishMeta[] = sortEntries(entries);

  const promises: Promise<void>[] = [
    publishIndexHtml({storageUpload, publishData, metas}),
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
  metas: PublishMeta[];
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
  metas: PublishMeta[];
}): Promise<void> => {
  const {bucketUrl, actor} = storageUpload;

  const sitemap: string = prepareSitemap({bucketUrl, metas});

  await uploadSitemapIC({sitemap, actor});
};

const publishIndexHtml = async ({
  storageUpload,
  publishData,
  metas
}: {
  storageUpload: StorageUpload;
  publishData: PublishData;
  metas: PublishMeta[];
}): Promise<void> => {
  const {bucketUrl, actor} = storageUpload;

  const html: string = await prepareIndexHtml({bucketUrl, publishData, metas});

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
