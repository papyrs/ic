import {log, Meta, PublishData} from '@deckdeckgo/editor';
import {encodeFilename, getStorageActor, upload} from '../api/storage.api';
import {_SERVICE as StorageBucketActor} from '../canisters/storage/storage.did';
import {EnvStore} from '../stores/env.store';
import {PublishCanisterIds} from '../types/publish.types';
import {BucketActor} from '../utils/manager.utils';
import {updateTemplateSocialImage} from './social.publish';

export interface StorageUpload {
  actor: StorageBucketActor;
  html: string;
  filename: string;
  pathname: string;
  fullUrl: string;
  bucketUrl: string;
  folder: 'p' | 'd';
}

export const updateTemplate = ({
  template,
  data,
  canisterIds
}: {
  template: string;
  data: Partial<PublishData>;
  canisterIds: PublishCanisterIds;
}): string =>
  [...Object.entries(data), ...Object.entries(canisterIds)].reduce(
    (acc: string, [key, value]: [string, string]) =>
      acc
        .replaceAll(`{{DECKDECKGO_${key.toUpperCase()}}}`, value || '')
        .replaceAll(`%%DECKDECKGO_${key.toUpperCase()}%%`, value || '')
        .replaceAll(`<!-- DECKDECKGO_${key.toUpperCase()} -->`, value || ''),
    template
  );

export const initUpload = async ({
  indexHTML,
  folder,
  meta
}: {
  indexHTML: {html: string; publishData: PublishData};
  folder: 'p' | 'd';
  meta: Meta | undefined;
}): Promise<{storageUpload: StorageUpload; publishData: PublishData}> => {
  const {html, publishData} = indexHTML;

  // 1. Get actor
  const {bucketId, actor}: BucketActor<StorageBucketActor> = await getStorageActor();

  // 2. Folder and filename
  const {filename, pathname} = uploadPaths({publishData, meta, folder});

  const bucketUrl: string = `https://${bucketId.toText()}.raw.ic0.app`;
  const fullUrl: string = `${bucketUrl}${pathname}`;

  // 3. Update URL
  let updatedHTML: string = html.replace('{{DECKDECKGO_URL}}', fullUrl);

  // 4. Update the social image URL
  updatedHTML = updateTemplateSocialImage({
    html: updatedHTML,
    data: publishData,
    bucketUrl
  });

  return {
    storageUpload: {
      html: updatedHTML,
      actor,
      filename,
      pathname,
      fullUrl,
      bucketUrl,
      folder
    },
    publishData
  };
};

/**
 * !!IMPORTANT!!: The pathname never changes if it has been published once otherwise we cannot delete the content when a doc or deck is deleted
 */
const uploadPaths = ({
  publishData,
  meta,
  folder
}: {
  publishData: PublishData;
  folder: 'p' | 'd';
  meta: Meta | undefined;
}): {filename: string; pathname: string} => {
  if (meta?.pathname) {
    const {pathname} = meta;

    return {
      filename: pathname.replace(`/${folder}/`, ''),
      pathname
    };
  }

  const filename: string = encodeFilename(publishData.title);
  const pathname: string = `/${folder}/${filename}`;

  return {
    filename,
    pathname
  };
};

export const initIndexHTML = async ({
  publishData,
  canisterIds,
  updateTemplateContent,
  sourceFolder
}: {
  publishData: PublishData;
  canisterIds: PublishCanisterIds;
  updateTemplateContent: ({attr, template}: {attr: string | undefined; template: string}) => string;
  sourceFolder: 'p' | 'd';
}): Promise<{html: string}> => {
  const template: string = await htmlTemplate(sourceFolder);

  const updatedTemplate: string = updateTemplate({
    template,
    data: publishData,
    canisterIds
  });

  const {attributes} = publishData;

  const attr: string | undefined = attributes
    ? Object.entries(attributes)
        .reduce((acc: string, [key, value]: [string, string]) => `${key}="${value}"; ${acc}`, '')
        .trim()
    : undefined;

  return {
    html: updateTemplateContent({attr, template: updatedTemplate})
  };
};

const htmlTemplate = async (sourceFolder: 'p' | 'd'): Promise<string> => {
  const htmlTemplate: Response = await fetch(
    `${EnvStore.getInstance().get().kitPath}/${sourceFolder}/index.html`
  );
  return htmlTemplate.text();
};

export const updateMetaData = <T>({
  data,
  storageUpload,
  meta,
  name
}: {
  data: T;
  meta: Meta;
  name: string;
  storageUpload: StorageUpload;
}): T => {
  const {pathname} = storageUpload;

  const now: Date = new Date();

  return {
    ...data,
    meta: {
      ...(meta || {title: name}),
      pathname,
      published: true,
      published_at: meta.published_at ?? now,
      updated_at: now
    }
  };
};

export const uploadPublishFileIC = async ({
  filename,
  html,
  actor,
  folder
}: {
  filename: string;
  html: string;
  actor: StorageBucketActor;
  folder: 'p' | 'd';
}): Promise<void> => {
  await upload({
    data: new Blob([html], {type: 'text/html'}),
    filename,
    folder,
    storageActor: actor,
    headers: [['Cache-Control', 'max-age=3600']],
    log
  });
};

export const getAuthor = (): string => EnvStore.getInstance().get().author;
