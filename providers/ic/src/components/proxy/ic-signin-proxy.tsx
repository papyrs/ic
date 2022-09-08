import {DerEncodedPublicKey, Signature} from '@dfinity/agent';
import {Delegation, DelegationChain} from '@dfinity/identity';
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
  AuthResponseFailure,
  InternetIdentityAuthRequest,
  InternetIdentityAuthResponseSuccess,
  PostMessageSignInInit,
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

  private parentOrigin: string | undefined;

  componentWillLoad() {
    this.identityProviderUrl = new URL(
      this.localIdentityCanisterId !== undefined
        ? `http://${this.localIdentityCanisterId}.localhost:8000`
        : internetIdentityMainnet
    );
    this.identityProviderUrl.hash = '#authorize';
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
    this.signInError.emit(text);
    this.signInInProgress = false;
  }

  private onInternetIdentitySuccess({
    delegations: messageDelegations,
    userPublicKey
  }: InternetIdentityAuthResponseSuccess) {
    const delegations = messageDelegations.map((signedDelegation) => ({
      delegation: new Delegation(
        signedDelegation.delegation.pubkey,
        signedDelegation.delegation.expiration,
        signedDelegation.delegation.targets
      ),
      signature: signedDelegation.signature.buffer as Signature
    }));

    const delegationChain = DelegationChain.fromDelegations(
      delegations,
      userPublicKey.buffer as DerEncodedPublicKey
    );

    if (!this.parentOrigin) {
      this.error('No parent origin');
      return;
    }

    parent.postMessage(
      {
        kind: 'papyrs-signin-delegation',
        delegation: delegationChain
      },
      this.parentOrigin
    );

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
      <ic-signin externalSignInState={this.signInState()} signIn={this.onSignIn}>
        <div slot="spinner">
          <slot name="spinner" />
        </div>
      </ic-signin>
    );
  }
}
