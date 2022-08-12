import {Doc, DocData, docPublishData, DocPublishData, PublishData} from '@deckdeckgo/editor';
import {setData} from '../services/data.services';
import {EnvStore} from '../stores/env.store';
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
  config
}: {
  doc: Doc;
  config: Record<string, string>;
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
    config
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

  // 3. Update doc meta information
  const doc: Doc = await setData<DocData>({
    key: `/docs/${id}`,
    entity: {
      ...docSource,
      data: docData
    }
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
  config
}: {
  doc: Doc;
  config: Record<string, string>;
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
