import {Doc, DocData, docPublishData, DocPublishData, PublishData} from '@deckdeckgo/editor';
import {get, update} from 'idb-keyval';
import {setData} from '../services/data.services';
import {EnvStore} from '../stores/env.store';
import {PublishCanisterIds} from '../types/publish.types';
import {
  initIndexHTML,
  initUpload,
  StorageUpload,
  updateMetaData,
  uploadPublishFileIC
} from './common.publish';
import {uploadSocialImage} from './social.publish';

export const publishDoc = async ({
  doc: docSource,
  config,
  canisterIds
}: {
  doc: Doc;
  config: Record<string, string>;
  canisterIds: PublishCanisterIds;
}): Promise<{
  doc: Doc;
  storageUpload: StorageUpload;
  publishData: PublishData;
}> => {
  const {id, data} = docSource;
  const {meta} = data;

  // 1. Init and fill HTML
  const indexHTML: {html: string; publishData: DocPublishData} = await initDocIndexHTML({
    doc: docSource,
    config,
    canisterIds
  });
  const {storageUpload, publishData} = await initUpload({
    indexHTML,
    folder: 'd',
    meta
  });

  // 2. Update doc published meta
  const docData: DocData = updateMetaData<DocData>({
    data,
    meta: data.meta,
    name: data.name,
    storageUpload
  });

  // 2.a We save the new meta data in IndexedDB and preserve current timestamps. We do that because setData will update the timestamps without updating the data in idb
  await update<Doc>(`/docs/${id}`, (currentData: Doc) => ({
    ...currentData,
    data: docData
  }));

  // 2.b We read the current record for the timestamps
  const record: Doc = await get(`/docs/${id}`);

  // 3. Update doc meta information
  const doc: Doc = await setData<DocData>({
    key: `/docs/${id}`,
    record,
    updateTimestamps: true
  });

  // 4. Upload
  await uploadPublishFileIC(storageUpload);

  // 5. Upload
  await uploadSocialImage({storageUpload, publishData});

  return {
    storageUpload,
    publishData,
    doc
  };
};

const initDocIndexHTML = async ({
  doc,
  config,
  canisterIds
}: {
  doc: Doc;
  config: Record<string, string>;
  canisterIds: PublishCanisterIds;
}): Promise<{html: string; publishData: DocPublishData}> => {
  const {theme, socialImgPath} = config;

  const publishData: DocPublishData = await docPublishData({
    doc,
    fallbackAuthor: EnvStore.getInstance().get().author,
    theme,
    socialImgPath
  });

  const {paragraphs} = publishData;

  const updateTemplateContent = ({
    attr,
    template
  }: {
    attr: string | undefined;
    template: string;
  }): string =>
    template.replace(
      '<!-- DECKDECKGO_DOC -->',
      `<article ${attr || ''} class="deckgo-doc">${paragraphs.join('')}</article>`
    );

  const {html}: {html: string} = await initIndexHTML({
    publishData,
    ids: {
      ...canisterIds,
      data_id: doc.id
    },
    updateTemplateContent,
    sourceFolder: 'd'
  });

  return {
    html,
    publishData
  };
};

export const emitDocPublished = (doc: Doc) => {
  const {id, data} = doc;

  const deployedDoc: Doc = {
    id,
    data: {
      ...data,
      deploy: {
        api: {
          status: 'successful',
          updated_at: new Date()
        }
      }
    }
  };

  const $event: CustomEvent<Doc> = new CustomEvent('docPublished', {
    detail: deployedDoc
  });
  document.dispatchEvent($event);
};
