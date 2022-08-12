import {update} from 'idb-keyval';
import {setData as setDataApi} from '../api/data.api';
import {_SERVICE as DataBucketActor} from '../canisters/data/data.did';
import {LogWindow} from '../types/sync.window';

export const setData = async <T, D>({
  key,
  data,
  id,
  actor = undefined,
  log
}: {
  key: string;
  data: D;
  id: string;
  actor?: DataBucketActor;
  log?: LogWindow;
}): Promise<T> => {
  log?.({msg: `[set][start] ${key}`});
  const t0 = performance.now();

  const updatedData: T = await setDataApi({key, data, id, actor});

  // Update the timestamp(s) in idb - the data has been updated in the backend so we will need the update timestamp for next update
  await update<T>(key, (data: T) => ({
    ...data,
    updated_at: (updatedData as unknown as {updated_at: Date}).updated_at
  }));

  const t1 = performance.now();
  log?.({msg: `[set][done] ${key}`, duration: t1 - t0});

  return updatedData;
};
