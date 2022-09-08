import {
  Component,
  ComponentInterface,
  Event,
  EventEmitter,
  h,
  Listen,
  Prop,
  State
} from '@stencil/core';
import {
  delegationIdentityExpiration,
  internetIdentityMainnet
} from '../../constants/auth.constants';
import {
  InternetIdentityAuthRequest,
  PapyrsSigninInit,
  SigninPostMessage
} from '../../types/singin.messages';

@Component({
  tag: 'ic-signin-proxy',
  shadow: false
})
export class IcSigninProxy implements ComponentInterface {
  @Prop()
  localIdentityCanisterId?: string;

  @State()
  private publicKey: ArrayBuffer | undefined = undefined;

  @State()
  private identityProviderUrl: URL | undefined;

  @State()
  private signInInProgress: boolean = false;

  @Event()
  signInError: EventEmitter<string | undefined>;

  private tab: WindowProxy | null | undefined;

  componentWillLoad() {
    this.identityProviderUrl = new URL(
      this.localIdentityCanisterId !== undefined
        ? `http://${this.localIdentityCanisterId}.localhost:8000`
        : internetIdentityMainnet
    );
    this.identityProviderUrl.hash = '#authorize';
  }

  @Listen('message', {target: 'window'})
  onMessage({data}: MessageEvent<Partial<SigninPostMessage>>) {
    const {kind} = data ?? {};

    // TODO: ⚠️ validate origin of caller ⚠️

    if (!kind) {
      return;
    }

    // TODO: handle ii auth success and failure

    switch (kind) {
      case 'papyrs-signin-init':
        this.publicKey = (data as PapyrsSigninInit).key;
        return;
      case 'authorize-ready':
        this.initInternetIdentityAuth();
        return;
    }
  }

  /**
   * Once Internet Identity has started, set the origin and the delegation length.
   * @private
   */
  private initInternetIdentityAuth() {
    if (!this.tab || this.signInState() !== 'ready') {
      this.signInError.emit('Authentication not ready.');
      this.signInInProgress = false;
      return;
    }

    this.signInInProgress = true;

    const request: InternetIdentityAuthRequest = {
      kind: 'authorize-client',
      sessionPublicKey: new Uint8Array(this.publicKey),
      maxTimeToLive: delegationIdentityExpiration
    };

    const {origin} = this.identityProviderUrl;

    this.tab?.postMessage(request, origin);
  }

  private onSignIn = () => {
    this.tab = window.open(this.identityProviderUrl.toString(), 'idpWindow');
  };

  private signInState(): 'initializing' | 'ready' | 'in-progress' {
    if (this.publicKey === undefined || this.identityProviderUrl === undefined) {
      return 'initializing';
    }

    return this.signInInProgress ? 'in-progress' : 'ready';
  }

  render() {
    return (
      <ic-signin externalSignInState={this.signInState()} signIn={this.onSignIn}>
        <div slot="spinner">
          <slot name="spinner" />
        </div>
      </ic-signin>
    );
  }
}
