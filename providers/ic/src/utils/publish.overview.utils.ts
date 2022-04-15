import {log, Meta, PublishData, toDate} from '@deckdeckgo/editor';
import {_SERVICE as StorageBucketActor} from '../canisters/storage/storage.did';
import {EnvStore} from '../stores/env.store';
import {StorageUpload, updateTemplate} from './publish.utils';
import {upload} from './storage.utils';

export const publishOverview = async ({
  dataId,
  storageUpload,
  publishData,
  meta
}: {
  dataId: string;
  storageUpload: StorageUpload;
  publishData: PublishData;
  meta: Meta | undefined;
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
    meta
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
  meta
}: {
  dataId: string;
  template: string;
  storageUpload: StorageUpload;
  publishData: PublishData;
  meta: Meta | undefined;
}): Promise<string> => {
  const source: string | undefined = await htmlSource(storageUpload);

  const link: string = newLink({dataId, meta, publishData, storageUpload});

  if (!source) {
    return template.replace(/<!-- DECKDECKGO_DATA -->/, `${link}`);
  }

  const matches: RegExpMatchArray[] = [...source.matchAll(/<a\x20.*?data-id=".*?"[\s\S]*?a>/gm)];

  if (!matches || matches.length <= 0) {
    return template.replace(/<!-- DECKDECKGO_DATA -->/, `${link}`);
  }

  const list: string[] = matches.map((match: RegExpMatchArray) => match[0]);

  const index: number = list.findIndex((a: string) => a.indexOf(dataId) > -1);

  if (index > -1) {
    return template.replace(
      /<!-- DECKDECKGO_DATA -->/,
      list.map((entry: string, i: number) => (i === index ? link : entry)).join('')
    );
  }

  return template.replace(/<!-- DECKDECKGO_DATA -->/, [link, ...list].join(''));
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
  meta: Meta | undefined;
}): string => {
  const {title} = publishData;
  const {fullUrl} = storageUpload;

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

const htmlSource = async ({bucketUrl}: StorageUpload): Promise<string | undefined> => {
  const response: Response = await fetch(bucketUrl);

  if (response.ok) {
    return response.text();
  }

  return undefined;
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
