import {
  DeleteFile,
  GetFiles,
  log,
  StorageFile,
  StorageFilesList,
  UploadFile
} from '@deckdeckgo/editor';
import {Identity} from '@dfinity/agent';
import {nanoid} from 'nanoid';
import {encodeFilename, getStorageActor, upload} from '../../api/storage.api';
import {AssetKey, _SERVICE as StorageBucketActor} from '../../canisters/storage/storage.did';
import {LogWindow} from '../../types/sync.window';
import {toNullable} from '../../utils/did.utils';
import {BucketActor, getStorageBucket} from '../../utils/manager.utils';
import {getIdentity} from '../auth/auth.providers';

export const uploadFile: UploadFile = async ({
  data,
  folder,
  maxSize
}: {
  data: File;
  folder: string;
  maxSize: number;
  userId: string;
  downloadUrl?: boolean;
}): Promise<StorageFile | undefined> => {
  const identity: Identity | undefined = getIdentity();

  return uploadFileIC({data, folder, maxSize, identity, log});
};

export const uploadFileIC = async ({
  data,
  maxSize,
  folder,
  identity,
  storageBucket,
  log
}: {
  data: File;
  folder: string;
  maxSize: number;
  identity: Identity;
  storageBucket?: BucketActor<StorageBucketActor>;
  log: LogWindow;
}): Promise<StorageFile> => {
  if (!data || !data.name) {
    throw new Error('File not valid.');
  }

  if (data.size > maxSize) {
    throw new Error(`File is too big (max. ${maxSize / 1048576} Mb)`);
  }

  const {actor, bucketId}: BucketActor<StorageBucketActor> =
    storageBucket || (await getStorageBucket({identity}));

  if (!actor || !bucketId) {
    throw new Error('Storage bucket is not initialized.');
  }

  const {fullPath, filename, token}: {fullPath: string; filename: string; token: string} =
    await upload({
      data,
      filename: encodeFilename(data.name),
      folder,
      storageActor: actor,
      token: nanoid(),
      headers: [['cache-control', 'private, max-age=0']],
      log
    });

  return {
    downloadUrl: `https://${bucketId.toText()}.raw.icp0.io${fullPath}?token=${token}`,
    fullPath,
    name: filename
  };
};

export const getFiles: GetFiles = async ({
  folder
}: {
  next: string | null;
  maxResults: number;
  folder: string;
  userId: string;
}): Promise<StorageFilesList | null> => {
  const {actor, bucketId}: BucketActor<StorageBucketActor> = await getStorageActor();

  const assets: AssetKey[] = await actor.list(toNullable<string>(folder));

  const host: string = `https://${bucketId.toText()}.raw.icp0.io`;

  return {
    items: assets.map(({name, full_path, token}: AssetKey) => ({
      downloadUrl: `${host}${full_path}?token=${token}`,
      fullPath: full_path,
      name
    })),
    nextPageToken: null
  };
};

export const deleteFile: DeleteFile = async ({
  downloadUrl,
  fullPath
}: StorageFile): Promise<void> => {
  const {actor}: BucketActor<StorageBucketActor> = await getStorageActor();

  let token: string | null = null;

  if (downloadUrl) {
    const {searchParams}: URL = new URL(downloadUrl);
    token = searchParams.get('token');
  }

  return actor.del({
    full_path: fullPath,
    token: toNullable<string>(token ? token : undefined)
  });
};
