import {Identity} from '@dfinity/agent';
import {_SERVICE as StorageBucketActor} from '../canisters/storage/storage.did';
import {getIdentity} from '../providers/auth/auth.providers';
import {HeaderField} from '../types/storage.types';
import {LogWindow} from '../types/sync.window';
import {toNullable} from '../utils/did.utils';
import {BucketActor, getStorageBucket} from '../utils/manager.utils';

export const upload = async ({
  data,
  filename,
  folder,
  storageActor,
  headers,
  token,
  fullPath: storagePath,
  log,
  sha256
}: {
  data: Blob;
  folder: string;
  filename: string;
  headers: HeaderField[];
  storageActor: StorageBucketActor;
  token?: string;
  fullPath?: string;
  log: LogWindow;
  sha256?: number[];
}): Promise<{fullPath: string; filename: string; token: string}> => {
  log({msg: `[upload][start] ${filename}`, level: 'info'});
  const t0 = performance.now();

  const fullPath: string = storagePath || `/${folder}/${filename}`;

  const {batch_id: batchId} = await storageActor.initUpload({
    name: filename,
    full_path: fullPath,
    token: toNullable<string>(token),
    folder,
    sha256: toNullable(sha256)
  });

  const t1 = performance.now();
  log({msg: `[upload][create batch] ${filename}`, duration: t1 - t0, level: 'info'});

  const chunkSize = 700000;

  const chunkIds: {chunk_id: bigint}[] = [];

  // Prevent transforming chunk to arrayBuffer error: The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.
  const clone: Blob = new Blob([await data.arrayBuffer()]);

  for (let start = 0; start < clone.size; start += chunkSize) {
    const chunk: Blob = clone.slice(start, start + chunkSize);

    chunkIds.push(
      await uploadChunk({
        batchId,
        chunk,
        storageActor
      })
    );
  }

  const t2 = performance.now();
  log({msg: `[upload][chunks] ${filename}`, duration: t2 - t1, level: 'info'});

  await storageActor.commitUpload({
    batch_id: batchId,
    chunk_ids: chunkIds.map(({chunk_id}: {chunk_id: bigint}) => chunk_id),
    headers: [['Content-Type', data.type], ['accept-ranges', 'bytes'], ...headers]
  });

  const t3 = performance.now();
  log({msg: `[upload][commit batch] ${filename}`, duration: t3 - t2, level: 'info'});
  log({msg: `[upload][done] ${filename}`, duration: t3 - t0, level: 'info'});

  return {
    fullPath,
    filename,
    token
  };
};

const uploadChunk = async ({
  batchId,
  chunk,
  storageActor
}: {
  batchId: bigint;
  chunk: Blob;
  storageActor: StorageBucketActor;
}): Promise<{chunk_id: bigint}> =>
  storageActor.uploadChunk({
    batch_id: batchId,
    content: [...new Uint8Array(await chunk.arrayBuffer())]
  });

export const encodeFilename = (filename: string): string =>
  encodeURI(filename.toLowerCase().replace(/\s/g, '-'));

export const getStorageActor = async (): Promise<BucketActor<StorageBucketActor>> => {
  const identity: Identity | undefined = getIdentity();

  if (!identity) {
    throw new Error('No internet identity.');
  }

  const result: BucketActor<StorageBucketActor> = await getStorageBucket({
    identity
  });

  const {actor, bucketId} = result;

  if (!actor) {
    throw new Error('No actor initialized.');
  }

  // That would be strange
  if (!bucketId) {
    throw new Error('No bucket principal defined');
  }

  return result;
};
