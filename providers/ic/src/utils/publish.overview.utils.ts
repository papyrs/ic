import {Deck, Doc, log, Meta, PublishData, toDate} from '@deckdeckgo/editor';
import {_SERVICE as StorageBucketActor} from '../canisters/storage/storage.did';
import {deckEntries} from '../providers/data/deck.providers';
import {docEntries} from '../providers/data/doc.providers';
import {EnvStore} from '../stores/env.store';
import {StorageUpload, updateTemplate} from './publish.utils';
import {upload} from './storage.utils';

export const publishDeckOverview = async ({
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

  await publishOverview({storageUpload, publishData, dataId, metas});
};

export const publishDocOverview = async ({
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

  await publishOverview({storageUpload, publishData, dataId, metas});
};

const mapMetas = (entries: (Doc | Deck)[]): Meta[] =>
  entries
    .filter(({data}: Doc | Deck) => data.meta?.published === true)
    .map(({data}: Doc | Deck) => data.meta)
    .sort(
      ({published_at: published_at_a}: Meta, {published_at: published_at_b}: Meta) =>
        (toDate(published_at_b)?.getTime() || 0) - (toDate(published_at_a)?.getTime() || 0)
    );

export const publishOverview = async ({
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
  const template: string = await htmlTemplate();

  const {photo_url, ...data} = publishData;

  let html: string = updateTemplate({template, data});
  html = updatePhotoUrl({html, photo_url});

  html = await updateList({
    dataId,
    template: html,
    publishData,
    storageUpload,
    metas
  });

  const {actor} = storageUpload;

  await uploadOverviewIC({html, actor});
};

const htmlTemplate = async (): Promise<string> => {
  const htmlTemplate: Response = await fetch(`${EnvStore.getInstance().get().kitPath}/index.html`);
  return htmlTemplate.text();
};

const updatePhotoUrl = ({
  photo_url,
  html
}: {
  photo_url: string | undefined;
  html: string;
}): string => {
  if (!photo_url) {
    return html;
  }

  return html.replace(
    '<!-- DECKDECKGO_PHOTO_URL -->',
    `<img role="presentation" alt="" loading="lazy" src="${photo_url}" />`
  );
};

const updateList = async ({
  dataId,
  template,
  storageUpload,
  publishData,
  metas
}: {
  dataId: string;
  template: string;
  storageUpload: StorageUpload;
  publishData: PublishData;
  metas: Meta[];
}): Promise<string> => {
  const links: string[] = metas.map((meta: Meta) =>
    newLink({dataId, meta, publishData, storageUpload})
  );

  return template.replace(/<!-- DECKDECKGO_DATA -->/, links.join(''));
};

const newLink = ({
  dataId,
  storageUpload,
  publishData,
  meta
}: {
  dataId: string;
  storageUpload: StorageUpload;
  publishData: PublishData;
  meta: Meta;
}): string => {
  const {title} = publishData;

  const {bucketUrl} = storageUpload;
  const {pathname} = meta;

  const fullUrl: string = `${bucketUrl}${pathname}`;

  const detail: string =
    meta?.description !== undefined && meta?.description !== null && meta?.description !== ''
      ? `<p class="description">${meta.description}</p>`
      : '';

  const {format}: Intl.DateTimeFormat = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  });
  const publishedAt: string = `<p>Published: ${format(
    toDate(meta?.published_at) ?? new Date()
  )}</p>`;
  const editedAt: string = `<p>Edited: ${format(toDate(meta?.updated_at) ?? new Date())}</p>`;

  return `<a data-id="${dataId}" href="${fullUrl}" rel="noopener noreferrer"><article><h3>${title}</h3>${detail}${publishedAt}${editedAt}</article></a>`;
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
