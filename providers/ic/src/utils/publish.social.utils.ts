import {log, PublishData} from '@deckdeckgo/editor';
import {StorageUpload} from './publish.utils';
import {upload} from './storage.utils';

const socialImageFolder: string = 'meta';
const socialImageExtension: string = 'png';

export const updateTemplateSocialImage = ({
  html,
  data,
  bucketUrl
}: {
  html: string;
  data: PublishData;
  bucketUrl: string;
}): string => {
  const {social_image_name} = data;

  if (hasSocialImageLink(data)) {
    const {social_image_link} = data;
    return html.replaceAll('{{DECKDECKGO_SOCIAL_IMAGE}}', social_image_link);
  }

  const pathname: string = `/${socialImageFolder}/${social_image_name}.${socialImageExtension}`;

  return html.replaceAll('{{DECKDECKGO_SOCIAL_IMAGE}}', `${bucketUrl}${pathname}`);
};

// User used an image in the first or second paragraph and we gonna use it for the social card assuming assuming crawlers can use it too
const hasSocialImageLink = ({social_image_link}: PublishData): boolean =>
  social_image_link !== undefined;

export const uploadSocialImage = async ({
  storageUpload,
  publishData
}: {
  storageUpload: StorageUpload;
  publishData: PublishData;
}): Promise<void> => {
  const {social_image_name, social_image_value} = publishData;

  if (hasSocialImageLink(publishData)) {
    return;
  }

  if (!social_image_value) {
    return;
  }

  const {actor} = storageUpload;

  await upload({
    data: social_image_value,
    filename: `${social_image_name}.${socialImageExtension}`,
    folder: socialImageFolder,
    storageActor: actor,
    headers: [['Cache-Control', 'max-age=3600']],
    log
  });
};
