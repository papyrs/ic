import {Meta, PublishData, toDate} from '@deckdeckgo/editor';
import {EnvStore} from '../stores/env.store';
import {PublishMeta} from '../types/publish.metas';
import {updateTemplate} from './publish.utils';

export const prepareIndexHtml = async ({
  bucketUrl,
  publishData,
  metas
}: {
  bucketUrl: string;
  publishData: PublishData;
  metas: PublishMeta[];
}): Promise<string> => {
  const template: string = await htmlTemplate();

  const {photo_url, ...data} = publishData;

  let html: string = updateTemplate({template, data});
  html = updatePhotoUrl({html, photo_url});

  html = await updateList({
    template: html,
    bucketUrl,
    metas
  });

  return html;
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
  template,
  bucketUrl,
  metas
}: {
  template: string;
  bucketUrl: string;
  metas: PublishMeta[];
}): Promise<string> => {
  const links: string[] = metas.map(({dataId, meta}: PublishMeta) =>
    newLink({dataId, meta, bucketUrl})
  );

  return template.replace(/<!-- DECKDECKGO_DATA -->/, links.join(''));
};

const newLink = ({
  dataId,
  bucketUrl,
  meta
}: {
  dataId: string;
  bucketUrl: string;
  meta: Meta;
}): string => {
  const {title, pathname} = meta;

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
