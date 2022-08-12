import {update} from 'idb-keyval';
import {setData as setDataApi} from '../api/data.api';
import {_SERVICE as DataBucketActor} from '../canisters/data/data.did';
import {Entity} from '../types/data';
import {LogWindow} from '../types/sync.window';

export const setData = async <D>({
  key,
  entity,
  actor = undefined,
  log
}: {
  key: string;
  entity: Entity<D>;
  actor?: DataBucketActor;
  log?: LogWindow;
}): Promise<Entity<D>> => {
  log?.({msg: `[set][start] ${key}`});
  const t0 = performance.now();

  const updatedEntity: Entity<D> = await setDataApi({key, actor, entity});

  // Update the timestamp(s) in idb - the data has been updated in the backend so we will need the update timestamp for next update
  await update<Entity<D>>(key, ({id, data}: Entity<D>) => ({
    id,
    data,
    created_at: updatedEntity.created_at,
    updated_at: updatedEntity.updated_at
  }));

  const t1 = performance.now();
  log?.({msg: `[set][done] ${key}`, duration: t1 - t0});

  return updatedEntity;
};
