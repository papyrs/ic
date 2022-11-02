import type {DataRecord} from '@deckdeckgo/editor';
import {update} from 'idb-keyval';
import {deleteData as deleteDataApi, setData as setDataApi} from '../api/data.api';
import {DelData, _SERVICE as DataBucketActor} from '../canisters/data/data.did';
import {LogWindow} from '../types/sync.window';

export const setData = async <D>({
  key,
  record,
  updateTimestamps = false,
  actor = undefined,
  log
}: {
  key: string;
  record: DataRecord<D>;
  updateTimestamps?: boolean;
  actor?: DataBucketActor;
  log?: LogWindow;
}): Promise<DataRecord<D>> => {
  log?.({msg: `[set][start] ${key}`, level: 'info'});
  const t0 = performance.now();

  const updatedEntity: DataRecord<D> = await setDataApi({key, actor, record});

  // Update the timestamp(s) in idb - the data has been updated in the backend so, we will need the update timestamp for next update
  // This only for those data that are offline first - the doc and paragraphs - i.e. not the user
  if (updateTimestamps) {
    await update<DataRecord<D>>(key, ({id, data}: DataRecord<D>) => ({
      id,
      data,
      created_at: updatedEntity.created_at,
      updated_at: updatedEntity.updated_at
    }));
  }

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
  if (!key || !data) {
    // Should never happen but, you never know
    return;
  }

  log?.({msg: `[delete][start] ${key}`, level: 'info'});
  const t0 = performance.now();

  await deleteDataApi({key, actor, data});

  const t1 = performance.now();
  log?.({msg: `[delete][done] ${key}`, duration: t1 - t0, level: 'info'});
};
