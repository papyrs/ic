import {AuthUser, DeleteAuth, InitAuth, log, SignOut, User} from '@deckdeckgo/editor';
import {Identity} from '@dfinity/agent';
import {AuthClient} from '@dfinity/auth-client';
import {del} from 'idb-keyval';
import {_SERVICE as ManagerActor} from '../../canisters/manager/manager.did';
import {delegationIdentityExpiration} from '../../constants/auth.constants';
import {EnvStore} from '../../stores/env.store';
import {EnvironmentIC} from '../../types/env.types';
import {SignOutWindow} from '../../types/sync.window';
import {createManagerActor} from '../../utils/manager.utils';
import {startIdleTime, stopIdleTimer} from '../../workers/idle.ic.worker';
import {initUserWorker} from '../../workers/user.ic.worker';

declare global {
  interface Window {
    authClient: AuthClient | undefined;
  }
}

let authClient: AuthClient | undefined;

const createAuthClient = (): Promise<AuthClient> =>
  AuthClient.create({
    idleOptions: {
      disableIdle: true,
      disableDefaultIdleCallback: true
    }
  });

export const initAuth: InitAuth = async ({
  config,
  success
}: {
  config: Record<string, string | boolean>;
  success: ({authUser, user}: {authUser: AuthUser | null; user: User | undefined}) => Promise<void>;
  reset: () => Promise<void>;
}) => {
  EnvStore.getInstance().set(config as EnvironmentIC);

  authClient = await createAuthClient();

  const isAuthenticated: boolean = (await authClient?.isAuthenticated()) || false;

  if (!isAuthenticated) {
    return;
  }

  await initUser({success});

  const onInitUserSuccess: (user: User) => Promise<void> = async (user: User) =>
    await authenticatedUser({user, success});

  try {
    await initUserWorker({env: EnvStore.getInstance().get()}, onInitUserSuccess, log);
  } catch (err: unknown) {
    const $event: CustomEvent<unknown> = new CustomEvent<unknown>('ddgInitUserError', {
      detail: err,
      bubbles: true
    });
    document.dispatchEvent($event);
    return;
  }

  const onSignOut: SignOutWindow = (): void => {
    const $event: CustomEvent<void> = new CustomEvent<void>('ddgSignOut', {
      bubbles: true
    });
    document.dispatchEvent($event);
  };

  startIdleTime(onSignOut).then(() => {
    // async await blocked with Astro
  });
};

// If first sign-in, initializing the canister can take a while therefore we already emit a not fully authenticated user
const initUser = async ({
  success
}: {
  success: ({authUser, user}: {authUser: AuthUser | null; user: User | undefined}) => Promise<void>;
}) => {
  const authUser: AuthUser = {
    state: 'initialization'
  } as AuthUser;

  await success({authUser, user: undefined});
};

const authenticatedUser = async ({
  user,
  success
}: {
  user: User;
  success: ({authUser, user}: {authUser: AuthUser | null; user: User | undefined}) => Promise<void>;
}) => {
  const {id, data} = user;

  const {name, email, photo_url} = data;

  const authUser: AuthUser = {
    uid: id,
    state: 'authenticated',
    name,
    email,
    photo_url
  } as AuthUser;

  await success({authUser, user});
};

export const signOut: SignOut = async (): Promise<void> => {
  await stopIdleTimer();

  await authClient?.logout();

  // Reset local object otherwise next sign in (sign in - sign out - sign in) might not work out - i.e. agent-js might not recreate the delegation or identity if not resetted
  authClient = undefined;

  // Just in case the user has been wrongly saved locally - this can be deleted in a bit
  await del('/user');
};

export const signIn = async ({
  onSuccess,
  onError
}: {
  onSuccess: () => void;
  onError: (err?: string) => void;
}) => {
  authClient = authClient || (await createAuthClient());

  await authClient.login({
    onSuccess,
    onError,
    maxTimeToLive: delegationIdentityExpiration,
    ...(EnvStore.getInstance().localIdentity() && {
      identityProvider: `http://${
        EnvStore.getInstance().get().localIdentityCanisterId
      }.localhost:8000?#authorize`
    })
  });
};

export const deleteAuth: DeleteAuth = async (_auth: {user: User; config}): Promise<void> => {
  const identity: Identity | undefined = getIdentity();

  if (!identity) {
    throw new Error('Invalid identity.');
  }

  const managerActor: ManagerActor = await createManagerActor({identity});
  await Promise.all([managerActor.delData(), managerActor.delStorage()]);
};

export const getIdentity = (): Identity | undefined => {
  return authClient?.getIdentity();
};

export const isAuthenticated = (): Promise<boolean | undefined> => {
  return authClient?.isAuthenticated();
};
