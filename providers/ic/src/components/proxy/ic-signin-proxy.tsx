import {Component, ComponentInterface, h, Listen, Prop, State} from '@stencil/core';
import {
  delegationIdentityExpiration,
  internetIdentityMainnet
} from '../../constants/auth.constants';
import {
  AuthResponseFailure,
  InternetIdentityAuthRequest,
  InternetIdentityAuthResponseSuccess,
  PostMessageSignInError,
  PostMessageSignInInit,
  PostMessageSignInSuccess,
  SigninPostMessage
} from '../../types/singin.messages';

@Component({
  tag: 'ic-signin-proxy',
  shadow: false
})
export class IcSigninProxy implements ComponentInterface {
  @Prop()
  i18n: Record<string, Record<string, string>>;

  @Prop()
  config: Record<string, string>;

  @Prop()
  localIdentityCanisterId?: string;

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
    this.identityProviderUrl = new URL(
      this.localIdentityCanisterId !== undefined
        ? `http://${this.localIdentityCanisterId}.localhost:8000`
        : internetIdentityMainnet
    );
    this.identityProviderUrl.hash = '#authorize';
  }

  componentDidLoad() {
    // We broadcast the message because there is no caller yet. This is safe since it does not include any data exchange.
    parent.postMessage({kind: 'papyrs-signin-ready'}, '*');
  }

  @Listen('message', {target: 'window'})
  onMessage({data, origin}: MessageEvent<Partial<SigninPostMessage>>) {
    const {kind} = data ?? {};

    // TODO: ⚠️ validate origin of caller ⚠️

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
