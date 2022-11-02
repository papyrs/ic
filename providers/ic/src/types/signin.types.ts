import {EnvironmentIC} from './env.types';

export interface SignInConfig {
  terms: string;
  privacy: string;
}

export type ProxySignInConfig = SignInConfig &
  Pick<EnvironmentIC, 'managerCanisterId' | 'localIdentityCanisterId'> & {
    derivationOrigin?: string;
  };
