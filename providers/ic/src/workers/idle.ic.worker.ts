import {isDelegationValid} from '@dfinity/authentication';
import {DelegationChain} from '@dfinity/identity';
import {SignOutWindow} from '../types/sync.window';
import {internetIdentityAuth} from '../utils/identity.utils';

let idleTimer: boolean = false;

export const startIdleTime = async (onSignOut: SignOutWindow) => {
  idleTimer = true;

  while (idleTimer) {
    await onIdleSignOut(onSignOut);

    // Sleep. setInterval not supported - throw an error upon trying to use postmessage "onSignOut" callback
    await new Promise((r) => setTimeout(r, 5000));
  }
};

const stopTimer = () => (idleTimer = false);

export const stopIdleTimer = async () => stopTimer();

const onIdleSignOut = async (onSignOut: SignOutWindow) => {
  const [delegationChain] = await internetIdentityAuth();

  if (delegationChain === null) {
    return;
  }

  if (isDelegationValid(DelegationChain.fromJSON(delegationChain))) {
    return;
  }

  // Clear timer to not emit sign-out multiple times
  stopTimer();

  onSignOut();
};
