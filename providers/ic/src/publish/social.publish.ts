import {log, PublishData} from '@deckdeckgo/editor';
import {upload} from '../api/storage.api';
import {StorageUpload} from './common.publish';

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

  if (hasUnsplashSocialImageLink(data)) {
    const {social_image_link} = data;
    return html.replaceAll('{{DECKDECKGO_SOCIAL_IMAGE}}', social_image_link);
  }

  const pathname: string = `/${socialImageFolder}/${social_image_name}.${socialImageExtension}`;

  return html.replaceAll('{{DECKDECKGO_SOCIAL_IMAGE}}', `${bucketUrl}${pathname}`);
};

// Did user used an image from an Unsplash in the first or second paragraph? If yes, we gonna use it for the social card.
//
// Note: We don't use users' images because we are blocking all crawlers to crawl /images/ in robots.txt to keep the images private.
// We would be able to add "allow" exceptions in the robots.txt (assuming it is supported by twitter bots) but it would mean that we would have to maintain a list of images that are public (e.g. what if user delete and image?).
// That's why, at least for now and for simplicity reason, we don't use users' own images as social images but generate the cards.
const hasUnsplashSocialImageLink = ({social_image_link}: PublishData): boolean =>
  social_image_link !== undefined && social_image_link.includes('unsplash.com');

export const uploadSocialImage = async ({
  storageUpload,
  publishData
}: {
  storageUpload: StorageUpload;
  publishData: PublishData;
}): Promise<void> => {
  const {social_image_name, social_image_value} = publishData;

  if (hasUnsplashSocialImageLink(publishData)) {
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
