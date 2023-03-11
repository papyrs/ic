import {Identity} from '@dfinity/agent';
import {KEY_STORAGE_DELEGATION, KEY_STORAGE_KEY} from '@dfinity/auth-client';
import {DelegationChain, DelegationIdentity, ECDSAKeyIdentity} from '@dfinity/identity';
import {createStore, getMany} from 'idb-keyval';

export const internetIdentityAuth = async (): Promise<
  [delegationChain: string | null, identityKey: CryptoKeyPair | null]
> => {
  const customStore = createStore('auth-client-db', 'ic-keyval');

  const [identityKey, delegationChain] = await getMany(
    [KEY_STORAGE_KEY, KEY_STORAGE_DELEGATION],
    customStore
  );

  return [delegationChain, identityKey];
};

export const initIdentity = async ({
  identityKey,
  delegationChain
}: {
  identityKey: CryptoKeyPair | null;
  delegationChain: string | null;
}): Promise<Identity> => {
  const chain: DelegationChain = DelegationChain.fromJSON(delegationChain);
  const key: ECDSAKeyIdentity = await ECDSAKeyIdentity.fromKeyPair(identityKey);

  return DelegationIdentity.fromDelegation(key, chain);
};
