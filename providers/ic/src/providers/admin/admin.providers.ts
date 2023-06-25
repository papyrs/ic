import {Identity} from '@dfinity/agent';
import {Principal} from '@dfinity/principal';
import {_SERVICE as DataBucketActor} from '../../canisters/data/data.did';
import {_SERVICE as ManagerActor} from '../../canisters/manager/manager.did';
import {_SERVICE as StorageBucketActor} from '../../canisters/storage/storage.did';
import {fromNullable} from '../../utils/did.utils';
import {
  BucketActor,
  createManagerActor,
  getDataBucket,
  getStorageBucket
} from '../../utils/manager.utils';
import {getIdentity} from '../auth/auth.providers';

export interface CanisterBalance {
  bucketId: Principal | undefined;
  balance: bigint;
}

export interface CanistersBalance {
  data: CanisterBalance;
  storage: CanisterBalance;
}

export const canistersBalance = async (): Promise<CanistersBalance> => {
  const identity: Identity | undefined = getIdentity();

  if (!identity) {
    throw new Error('No internet identity to get the canisters status');
  }

  const [dataBucket, storageBucket]: [
    BucketActor<DataBucketActor>,
    BucketActor<StorageBucketActor>
  ] = await Promise.all([
    getDataBucket({
      identity
    }),
    getStorageBucket({identity})
  ]);

  const {actor: dataActor, bucketId: dataBucketId}: BucketActor<DataBucketActor> = dataBucket;
  const {actor: storageActor, bucketId: storageBucketId}: BucketActor<StorageBucketActor> =
    storageBucket;

  const [dataBalance, storageBalance]: [bigint, bigint] = await Promise.all([
    dataActor.cyclesBalance(),
    storageActor.cyclesBalance()
  ]);

  return {
    data: {
      bucketId: dataBucketId,
      balance: dataBalance
    },
    storage: {
      bucketId: storageBucketId,
      balance: storageBalance
    }
  };
};

export interface CanisterControllers {
  data: Principal[];
  storage: Principal[];
}

export const canistersControllers = async (): Promise<CanisterControllers> => {
  const identity: Identity | undefined = getIdentity();

  if (!identity) {
    throw new Error('No internet identity to get the canisters controllers');
  }

  const {getDataControllers, getStorageControllers}: ManagerActor = await createManagerActor({
    identity
  });

  const [dataControllers, storageControllers] = await Promise.all([
    getDataControllers(),
    getStorageControllers()
  ]);

  return {
    data: fromNullable(dataControllers) ?? [],
    storage: fromNullable(storageControllers) ?? []
  };
};
