import {Identity} from '@dfinity/agent';
import {Data, DataFilter, _SERVICE as DataBucketActor} from '../canisters/data/data.did';
import {getIdentity} from '../providers/auth/auth.providers';
import {Entity} from '../types/data';
import {LogWindow} from '../types/sync.window';
import {fromArray, fromNullable, toArray, toNullable} from '../utils/did.utils';
import {BucketActor, getDataBucket} from '../utils/manager.utils';

export const entries = async <D>({
  startsWith,
  notContains
}: {
  startsWith?: string;
  notContains?: string;
}): Promise<Entity<D>[]> => {
  const identity: Identity | undefined = getIdentity();

  if (!identity) {
    return [];
  }

  const {actor}: BucketActor<DataBucketActor> = await getDataBucket({
    identity
  });

  if (!actor) {
    return [];
  }

  const data: [string, Data][] = await actor.list(
    toNullable<DataFilter>({
      startsWith: toNullable<string>(startsWith),
      notContains: toNullable<string>(notContains)
    })
  );

  const promises: Promise<Entity<D>>[] = data.map(([, data]: [string, Data]) =>
    fromData<D>({data, identity})
  );

  return Promise.all(promises);
};

const fromData = async <D>({
  data,
  identity
}: {
  data: Data;
  identity: Identity;
}): Promise<Entity<D>> => {
  const dataData: D = await fromArray<D>(data.data);

  return {
    id: data.id,
    data: {
      ...dataData,
      owner_id: identity.getPrincipal().toText()
    },
    created_at: data.created_at,
    updated_at: data.updated_at
  };
};

export const deleteData = async ({
  key,
  actor,
  log
}: {
  key: string;
  actor?: DataBucketActor;
  log?: LogWindow;
}): Promise<void> => {
  if (!key) {
    return;
  }

  log?.({msg: `[delete][start] ${key}`});
  const t0 = performance.now();

  const dataActor: DataBucketActor = actor || (await getDataActor());

  await dataActor.del(key);

  const t1 = performance.now();
  log?.({msg: `[delete][done] ${key}`, duration: t1 - t0});
};

export const getData = async <D>({
  key,
  actor
}: {
  key: string;
  actor?: DataBucketActor;
}): Promise<Entity<D> | undefined> => {
  const dataActor: DataBucketActor = actor || (await getDataActor());

  const entry: Data | undefined = fromNullable<Data>(await dataActor.get(key));

  if (!entry) {
    return undefined;
  }

  const data: D = await fromArray<D>(entry.data);

  return {
    id: entry.id,
    data,
    created_at: entry.created_at,
    updated_at: entry.updated_at
  };
};

export const setData = async <D>({
  key,
  entity,
  actor = undefined
}: {
  key: string;
  entity: Entity<D>;
  actor?: DataBucketActor;
}): Promise<Entity<D>> => {
  const dataActor: DataBucketActor = actor || (await getDataActor());

  const {id, data, created_at, updated_at} = entity;

  const updatedData: Data = await dataActor.put(key, {
    id,
    data: await toArray<D>(data),
    created_at: toNullable(created_at),
    updated_at: toNullable(updated_at)
  });

  // We update the data with the updated_at timestamp generated in the backend.
  // The canister checks if the updated_at date is equals to the entity timestamp otherwise it rejects the update to prevent overwrite of data if user uses multiple devices.
  // In other words: to update a data, the current updated_at information need to be provided.
  return {
    id,
    data,
    created_at: updatedData.created_at,
    updated_at: updatedData.updated_at
  };
};

const getDataActor = async (): Promise<DataBucketActor> => {
  const identity: Identity | undefined = getIdentity();

  if (!identity) {
    throw new Error('No internet identity.');
  }

  const {actor}: BucketActor<DataBucketActor> = await getDataBucket({
    identity
  });

  if (!actor) {
    throw new Error('No actor initialized.');
  }

  return actor;
};
