import {Identity} from '@dfinity/agent';
import {IdbStorage} from '@dfinity/auth-client';
import {DelegationChain, DelegationIdentity, Ed25519KeyIdentity} from '@dfinity/identity';

export const internetIdentityAuth = async (): Promise<
  [delegationChain: string | null, identityKey: string | null]
> => {
  const idbStorage: IdbStorage = new IdbStorage();
  return Promise.all([idbStorage.get('delegation'), idbStorage.get('identity')]);
};

export const initIdentity = ({
  identityKey,
  delegationChain
}: {
  identityKey: string | null;
  delegationChain: string | null;
}): Identity => {
  const chain: DelegationChain = DelegationChain.fromJSON(delegationChain);
  const key: Ed25519KeyIdentity = Ed25519KeyIdentity.fromJSON(identityKey);

  return DelegationIdentity.fromDelegation(key, chain);
};
