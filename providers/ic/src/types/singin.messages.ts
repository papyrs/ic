import type {Principal} from '@dfinity/principal';

export interface SigninPostMessage {
  kind:
    | 'authorize-client'
    | 'authorize-client-success'
    | 'authorize-ready'
    | 'authorize-client-failure'
    | 'papyrs-signin-init';
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
  delegations: {
    delegation: {
      pubkey: Uint8Array;
      expiration: bigint;
      targets?: Principal[];
    };
    signature: Uint8Array;
  }[];
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

export interface PapyrsPostMessageSigninInit extends Omit<SigninPostMessage, 'kind'> {
  kind: 'papyrs-signin-init';
  key: ArrayBuffer;
}
