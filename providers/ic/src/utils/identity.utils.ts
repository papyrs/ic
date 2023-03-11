import {Identity} from '@dfinity/agent';
import {KEY_STORAGE_DELEGATION, KEY_STORAGE_KEY} from '@dfinity/auth-client';
import {DelegationChain, DelegationIdentity, ECDSAKeyIdentity, Ed25519KeyIdentity} from '@dfinity/identity';
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
  identityKey: CryptoKeyPair | string | null;
  delegationChain: string | null;
}): Promise<Identity> => {
  const chain: DelegationChain = DelegationChain.fromJSON(delegationChain);

  // TODO: remove me in a bit (11.03.2023)
  // Turns out agent-js fails at migrating existing key in production
  if (typeof identityKey === "string") {
    const key: Ed25519KeyIdentity = Ed25519KeyIdentity.fromJSON(identityKey);

    return DelegationIdentity.fromDelegation(key, chain);
  }

  const key: ECDSAKeyIdentity = await ECDSAKeyIdentity.fromKeyPair(identityKey);

  return DelegationIdentity.fromDelegation(key, chain);
};
