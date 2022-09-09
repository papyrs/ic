import {Component, ComponentInterface, h, Listen, Prop, State} from '@stencil/core';
import {
  delegationIdentityExpiration,
  internetIdentityMainnet
} from '../../constants/auth.constants';
import {EnvStore} from '../../stores/env.store';
import {EnvironmentIC} from '../../types/env.types';
import {
  AuthResponseFailure,
  InternetIdentityAuthRequest,
  InternetIdentityAuthResponseSuccess,
  PostMessageSignInError,
  PostMessageSignInInit,
  PostMessageSignInSuccess,
  SigninPostMessage
} from '../../types/singin.messages';
import { AnonymousIdentity, Identity } from "@dfinity/agent";
import { _SERVICE as ManagerActor } from "../../canisters/manager/manager.did";
import { createManagerActor } from "../../utils/manager.utils";

@Component({
  tag: 'ic-signin-proxy',
  shadow: false
})
export class IcSigninProxy implements ComponentInterface {
  @Prop()
  i18n: Record<string, Record<string, string>>;

  @Prop()
  config: Record<string, string>;

  @State()
  private publicKey: ArrayBuffer | undefined = undefined;

  @State()
  private identityProviderUrl: URL | undefined;

  @State()
  private signInInProgress: boolean = false;

  @State()
  private parentOrigin: string | undefined;

  private tab: WindowProxy | null | undefined;

  componentWillLoad() {
    EnvStore.getInstance().set(this.config as EnvironmentIC);

    this.identityProviderUrl = new URL(
      EnvStore.getInstance().get().localIdentityCanisterId !== undefined
        ? `http://${EnvStore.getInstance().get().localIdentityCanisterId}.localhost:8000`
        : internetIdentityMainnet
    );
    this.identityProviderUrl.hash = '#authorize';
  }

  componentDidLoad() {
    // We broadcast the message because there is no caller yet. This is safe since it does not include any data exchange.
    parent.postMessage({kind: 'papyrs-signin-ready'}, '*');
  }

  @Listen('message', {target: 'window'})
  async onMessage({data, origin}: MessageEvent<Partial<SigninPostMessage>>) {
    const {kind} = data ?? {};

    try {
      await this.assertOrigin(origin);
    } catch (err) {
      this.error(err.message);
      return;
    }

    if (!kind) {
      return;
    }

    switch (kind) {
      case 'papyrs-signin-init':
        this.onPapyrsInit({origin, data: data as PostMessageSignInInit});
        return;
      case 'authorize-ready':
        this.onInternetIdentityReady();
        return;
      case 'authorize-client-failure':
        this.onInternetIdentityFailure(data as AuthResponseFailure);
        return;
      case 'authorize-client-success':
        this.onInternetIdentitySuccess(data as InternetIdentityAuthResponseSuccess);
        return;
    }
  }

  /**
   * ⚠️ validate origin of caller ⚠️
   * @param origin
   * @private
   */
  private async assertOrigin(_origin: string) {
    const identity: Identity = new AnonymousIdentity();
    const managerActor: ManagerActor = await createManagerActor({identity});
    const knownBucket: boolean = await managerActor.knownBucket('rkp4c-7iaaa-aaaaa-aaaca-cai', 'storage');

    if (!knownBucket) {
      throw new Error('Caller is not a valid Papyrs origin and has no right to use this signin.');
    }
  }

  private onPapyrsInit({origin, data: {key}}: {origin: string; data: PostMessageSignInInit}) {
    this.parentOrigin = origin;
    this.publicKey = key;
  }

  /**
   * Once Internet Identity has started, set the origin and the delegation duration (session length).
   * @private
   */
  private onInternetIdentityReady() {
    if (!this.tab || this.signInState() !== 'ready') {
      this.error('Authentication not ready.');
      return;
    }

    this.signInInProgress = true;

    const request: InternetIdentityAuthRequest = {
      kind: 'authorize-client',
      sessionPublicKey: new Uint8Array(this.publicKey),
      maxTimeToLive: delegationIdentityExpiration
    };

    const {origin} = this.identityProviderUrl;

    this.tab.postMessage(request, origin);
  }

  /**
   * The sign-in failed in internet identity
   * @private
   */
  private onInternetIdentityFailure({text}: AuthResponseFailure) {
    this.error(text);
  }

  private error(text: string) {
    this.parentPostMessage({
      kind: 'papyrs-signin-error',
      text
    });

    this.signInInProgress = false;
  }

  private parentPostMessage(msg: PostMessageSignInSuccess | PostMessageSignInError) {
    if (!this.parentOrigin) {
      console.error('No parent origin');
      this.signInInProgress = false;
      return;
    }

    parent.postMessage(msg, this.parentOrigin);
  }

  private onInternetIdentitySuccess({
    delegations,
    userPublicKey
  }: InternetIdentityAuthResponseSuccess) {
    this.parentPostMessage({
      kind: 'papyrs-signin-success',
      delegations,
      userPublicKey
    });

    this.tab?.close();

    this.signInInProgress = false;
  }

  private onSignIn = () => {
    this.tab = window.open(this.identityProviderUrl.toString(), 'idpWindow');
  };

  private signInState(): 'initializing' | 'ready' | 'in-progress' {
    if (
      this.publicKey === undefined ||
      this.parentOrigin === undefined ||
      this.identityProviderUrl === undefined
    ) {
      return 'initializing';
    }

    return this.signInInProgress ? 'in-progress' : 'ready';
  }

  render() {
    return (
      <ic-signin
        i18n={this.i18n}
        config={this.config}
        externalSignInState={this.signInState()}
        signIn={this.onSignIn}>
        <div slot="spinner">
          <slot name="spinner" />
        </div>
      </ic-signin>
    );
  }
}
