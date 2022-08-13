import {update} from 'idb-keyval';
import {setData as setDataApi} from '../api/data.api';
import {_SERVICE as DataBucketActor} from '../canisters/data/data.did';
import {IdbData} from '../types/data';
import {LogWindow} from '../types/sync.window';

export const setData = async <D>({
  key,
  idbData,
  actor = undefined,
  log
}: {
  key: string;
  idbData: IdbData<D>;
  actor?: DataBucketActor;
  log?: LogWindow;
}): Promise<IdbData<D>> => {
  log?.({msg: `[set][start] ${key}`});
  const t0 = performance.now();

  const updatedEntity: IdbData<D> = await setDataApi({key, actor, idbData: idbData});

  // Update the timestamp(s) in idb - the data has been updated in the backend so we will need the update timestamp for next update
  await update<IdbData<D>>(key, ({id, data}: IdbData<D>) => ({
    id,
    data,
    created_at: updatedEntity.created_at,
    updated_at: updatedEntity.updated_at
  }));

  const t1 = performance.now();
  log?.({msg: `[set][done] ${key}`, duration: t1 - t0});

  return updatedEntity;
};
