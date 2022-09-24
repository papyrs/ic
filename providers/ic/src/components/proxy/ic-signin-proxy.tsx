import {AnonymousIdentity, Identity} from '@dfinity/agent';
import {Component, ComponentInterface, h, Listen, Prop, State} from '@stencil/core';
import {_SERVICE as ManagerActor} from '../../canisters/manager/manager.did';
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
import {createManagerActor} from '../../utils/manager.utils';

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

  private trustedOrigin: boolean | undefined = undefined;

  private closeTabInterval: NodeJS.Timer | undefined = undefined;

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

  disconnectedCallback() {
    this.clearCloseTabInterval();
  }

  @Listen('message', {target: 'window'})
  async onMessage({data, origin}: MessageEvent<Partial<SigninPostMessage>>) {
    const {kind} = data ?? {};

    if (!kind) {
      return;
    }

    // The initialization of the validity of the origin must come first (we do not want to perform an update cal to the manager on each message)
    if (kind === 'papyrs-signin-init') {
      await this.assertOriginSSO(origin);
    } else {
      this.assertOriginTrusted();
      this.assertOriginII(origin);
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

  private assertOriginTrusted() {
    if (this.trustedOrigin === false) {
      throw new Error(
        'Previous calls were emitted from a not trusted origin and therefore this service shall not be used.'
      );
    }

    if (this.trustedOrigin === undefined) {
      throw new Error(
        'The origin has not been initialized and therefore we cannot tell if this message can be trusted or not.'
      );
    }
  }

  private assertOriginII(origin: string) {
    const {origin: expectedOriginII} = new URL(this.identityProviderUrl);

    if (expectedOriginII !== origin) {
      throw new Error('An authentication message was not provided by Internet Identity!');
    }
  }

  /**
   * ⚠️ Validate origin of caller that initialized the SSO ⚠️
   * @param origin
   * @private
   */
  private async assertOriginSSO(origin: string) {
    // We test host and not hostname because doing so, we also test the origin with port
    const {host: originHost}: URL = new URL(origin);

    // We trust papy.rs - our own domain
    if (originHost.endsWith('papy.rs')) {
      this.trustedOrigin = true;
      return;
    }

    const canisterId: string = originHost.split('.')[0];
    const regExp = /([a-zA-Z0-9]{5}-){4}[a-zA-Z0-9]{3}/;

    if (!regExp.test(canisterId)) {
      this.trustedOrigin = false;
      throw new Error(
        `Origin (${origin}) of the message is not a canister and therefore, shall not use this signin.`
      );
    }

    const identity: Identity = new AnonymousIdentity();
    const managerActor: ManagerActor = await createManagerActor({identity});
    this.trustedOrigin = await managerActor.knownBucket(canisterId, 'storage');

    if (this.trustedOrigin !== true) {
      throw new Error(
        `Caller origin (${origin}) is not a valid Papyrs origin and has no right to use this signin.`
      );
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
      this.throwError('Authentication not ready.');
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
    this.tab?.close();

    this.throwError(text);

    this.cleanUp();
  }

  private throwError(text: string) {
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

    this.cleanUp();
  }

  private cleanUp() {
    this.trustedOrigin = undefined;
    this.publicKey = undefined;
  }

  private onSignIn = () => {
    this.tab = window.open(this.identityProviderUrl.toString(), 'idpWindow');

    this.observeCloseTab();
  };

  private observeCloseTab() {
    this.closeTabInterval = setInterval(() => {
      if (!this.tab?.closed) {
        return;
      }

      this.clearCloseTabInterval();

      this.throwError('User interrupted sign in.');
    }, 500);
  }

  private clearCloseTabInterval() {
    if (!this.closeTabInterval) {
      return;
    }

    clearInterval(this.closeTabInterval);
  }

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
