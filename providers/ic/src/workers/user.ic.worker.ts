import {User, UserData} from '@deckdeckgo/editor';
import {Identity} from '@dfinity/agent';
import {nanoid} from 'nanoid';
import {getData} from '../api/data.api';
import {_SERVICE as DataBucketActor} from '../canisters/data/data.did';
import {setData} from '../services/data.services';
import {EnvStore} from '../stores/env.store';
import {EnvironmentIC} from '../types/env.types';
import {LogWindow} from '../types/sync.window';
import {initIdentity, internetIdentityAuth} from '../utils/identity.utils';
import {BucketActor, getDataBucket} from '../utils/manager.utils';

export const initUserWorker = (
  {
    env
  }: {
    env: EnvironmentIC;
  },
  onInitUserSuccess: (user: User) => Promise<void>,
  log: LogWindow
): Promise<void> => {
  // Web worker do not share window
  EnvStore.getInstance().set(env);

  return initUser(onInitUserSuccess, log);
};

const initUser = async (onInitUserSuccess: (user: User) => Promise<void>, log: LogWindow) =>
  new Promise<void>(async (resolve, reject) => {
    const [delegationChain, identityKey] = await internetIdentityAuth();

    if (!delegationChain || !identityKey) {
      reject('No delegationChain or identityKey provided.');
      return;
    }

    const identity: Identity = initIdentity({identityKey, delegationChain});

    const {actor}: BucketActor<DataBucketActor> = await getDataBucket({
      identity
    });

    if (!actor) {
      setTimeout(async () => {
        await initUser(onInitUserSuccess, log);
        resolve();
      }, 2000);
      return;
    }

    const user: User = await initUserData({actor, log});
    await onInitUserSuccess(user);

    resolve();
  });

const initUserData = async ({
  actor,
  log
}: {
  actor: DataBucketActor;
  log: LogWindow;
}): Promise<User> => {
  log({msg: `[get][start] user`, level: 'info'});
  const t0 = performance.now();

  const user: User | undefined = await getData<UserData>({
    key: `/user`,
    actor
  });

  const t1 = performance.now();
  log({msg: `[get][done] user`, duration: t1 - t0, level: 'info'});

  if (!user) {
    const newUser: User = await createUser({actor, log});
    return newUser;
  }

  return user;
};

const createUser = async ({
  actor,
  log
}: {
  actor: DataBucketActor;
  log: LogWindow;
}): Promise<User> => {
  const now: Date = new Date();

  const id: string = nanoid();

  const data: UserData = {
    created_at: now,
    updated_at: now
  };

  return setData<UserData>({
    key: `/user`,
    record: {
      id,
      data
    },
    actor,
    log
  });
};
