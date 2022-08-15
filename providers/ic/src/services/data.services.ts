import type {DataRecord} from '@deckdeckgo/editor';
import {update, del} from 'idb-keyval';
import {deleteData as deleteDataApi, setData as setDataApi} from '../api/data.api';
import {DelData, _SERVICE as DataBucketActor} from '../canisters/data/data.did';
import {LogWindow} from '../types/sync.window';

export const setData = async <D>({
  key,
  idbData,
  actor = undefined,
  log
}: {
  key: string;
  idbData: DataRecord<D>;
  actor?: DataBucketActor;
  log?: LogWindow;
}): Promise<DataRecord<D>> => {
  log?.({msg: `[set][start] ${key}`, level: 'info'});
  const t0 = performance.now();

  const updatedEntity: DataRecord<D> = await setDataApi({key, actor, idbData: idbData});

  // Update the timestamp(s) in idb - the data has been updated in the backend so we will need the update timestamp for next update
  await update<DataRecord<D>>(key, ({id, data}: DataRecord<D>) => ({
    id,
    data,
    created_at: updatedEntity.created_at,
    updated_at: updatedEntity.updated_at
  }));

  const t1 = performance.now();
  log?.({msg: `[set][done] ${key}`, duration: t1 - t0, level: 'info'});

  return updatedEntity;
};

export const deleteData = async ({
  key,
  actor,
  log,
  data
}: {
  key: string | undefined;
  actor?: DataBucketActor;
  log?: LogWindow;
  data?: DelData;
}): Promise<void> => {
  if (!key) {
    // Should never happen but, you never know
    return;
  }

  log?.({msg: `[delete][start] ${key}`, level: 'info'});
  const t0 = performance.now();

  await deleteDataApi({key, actor, data});

  // TODO: remove if once deprecated code will be removed
  if (data !== undefined) {
    // Paragraph has been deleted in the cloud, we can delete the local record
    await del(key);
  }

  const t1 = performance.now();
  log?.({msg: `[delete][done] ${key}`, duration: t1 - t0, level: 'info'});
};
