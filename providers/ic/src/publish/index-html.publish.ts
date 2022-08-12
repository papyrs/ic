import {Meta, PublishData, toDate} from '@deckdeckgo/editor';
import {EnvStore} from '../stores/env.store';
import {PublishMeta} from '../types/publish.metas';
import {updateTemplate} from './common.publish';

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

  html = updatePostsList({
    content: html,
    bucketUrl,
    metas,
    selector: /<!-- DECKDECKGO_DATA -->/
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

const updatePostsList = ({
  content,
  bucketUrl,
  metas,
  selector
}: {
  content: string;
  bucketUrl: string;
  metas: PublishMeta[];
  selector: RegExp | string;
}): string => {
  const links: string[] = metas.map(({dataId, meta}: PublishMeta) =>
    newLink({dataId, meta, bucketUrl})
  );

  return content.replace(selector, links.join(''));
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

  return `<a data-id="${dataId}" href="${fullUrl}" rel="noopener noreferrer"><article><div><h3>${title}</h3>${detail}</div><div>${publishedAt}${editedAt}</div></article></a>`;
};

export const updateIndexHtmlPosts = async ({
  metas,
  bucketUrl
}: {
  bucketUrl: string;
  metas: PublishMeta[];
}): Promise<string | undefined> => {
  // Note: local environment does not support cors currently therefore this will fail locally
  const source: string | undefined = await htmlSource(bucketUrl);

  if (!source) {
    return undefined;
  }

  // Remove all existing entries
  const matches: RegExpMatchArray[] = [
    ...source.matchAll(/<section id="posts"[\s\S]*?>([\s\S]*?)<\/section>/gm)
  ];

  // Match all + group that contains all posts
  if (matches.length < 1 && matches[0].length < 2) {
    return undefined;
  }

  const currentPosts: string = matches[0][1];

  return updatePostsList({content: source, metas, bucketUrl, selector: currentPosts});
};

const htmlSource = async (bucketUrl: string): Promise<string | undefined> => {
  const response: Response = await fetch(bucketUrl);

  if (response.ok) {
    return response.text();
  }

  return undefined;
};
