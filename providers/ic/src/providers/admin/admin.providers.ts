import {Identity} from '@dfinity/agent';
import {CanisterStatus, _SERVICE as ManagerActor} from '../../canisters/manager/manager.did';
import {createManagerActor} from '../../utils/manager.utils';
import {getIdentity} from '../auth/auth.providers';

export interface CanistersStatus {
  data: CanisterStatus;
  storage: CanisterStatus;
}

export const canistersStatus = async (): Promise<CanistersStatus> => {
  const identity: Identity | undefined = getIdentity();

  if (!identity) {
    throw new Error('No internet identity to get the canisters status');
  }

  const managerActor: ManagerActor = await createManagerActor({identity});

  return managerActor.getCanistersStatus();
};
