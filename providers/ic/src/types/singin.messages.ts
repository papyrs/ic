import type {Principal} from '@dfinity/principal';

export interface SigninPostMessage {
  kind:
    | 'authorize-client'
    | 'authorize-client-success'
    | 'authorize-ready'
    | 'authorize-client-failure'
    | 'papyrs-signin-init'
    | 'papyrs-signin-success'
    | 'papyrs-signin-error';
}

export interface InternetIdentityDelegation {
  pubkey: Uint8Array;
  expiration: bigint;
  targets?: Principal[];
}

export interface InternetIdentityDelegationSignature {
  delegation: InternetIdentityDelegation;
  signature: Uint8Array;
}

// Types copied from agent-js
export interface InternetIdentityAuthRequest extends Omit<SigninPostMessage, 'kind'> {
  kind: 'authorize-client';
  sessionPublicKey: Uint8Array;
  maxTimeToLive?: bigint;
  derivationOrigin?: string;
}

export interface InternetIdentityAuthResponseSuccess extends Omit<SigninPostMessage, 'kind'> {
  kind: 'authorize-client-success';
  delegations: InternetIdentityDelegationSignature[];
  userPublicKey: Uint8Array;
}

export interface AuthReadyMessage extends Omit<SigninPostMessage, 'kind'> {
  kind: 'authorize-ready';
}

export interface AuthResponseFailure extends Omit<SigninPostMessage, 'kind'> {
  kind: 'authorize-client-failure';
  text: string;
}

// Type: custom type

export interface PostMessageSignInInit extends Omit<SigninPostMessage, 'kind'> {
  kind: 'papyrs-signin-init';
  key: ArrayBuffer;
}

export interface PostMessageSignInSuccess
  extends Omit<InternetIdentityAuthResponseSuccess, 'kind'> {
  kind: 'papyrs-signin-success';
}

export interface PostMessageSignInError extends Omit<SigninPostMessage, 'kind'> {
  kind: 'papyrs-signin-error';
  text: string;
}
