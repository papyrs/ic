import {DerEncodedPublicKey, Identity, Signature} from '@dfinity/agent';
import {
  Delegation,
  DelegationChain,
  DelegationIdentity,
  Ed25519KeyIdentity
} from '@dfinity/identity';
import {Component, ComponentInterface, Event, EventEmitter, h, Listen} from '@stencil/core';
import {createStore, setMany} from 'idb-keyval';
import {
  PostMessageSignInError,
  PostMessageSignInSuccess,
  SigninPostMessage
} from '../../types/singin.messages';

@Component({
  tag: 'ic-signin-caller',
  shadow: true
})
export class IcSigninProxy implements ComponentInterface {
  @Event()
  signInError: EventEmitter<string | undefined>;

  private ref!: HTMLObjectElement;

  private ed25519Key: Ed25519KeyIdentity | undefined = undefined;

  @Listen('message', {target: 'window'})
  async onMessage({data, origin: messageOrigin}: MessageEvent<Partial<SigninPostMessage>>) {
    const {
      contentWindow: {origin}
    } = this.ref;

    if (origin !== messageOrigin) {
      return;
    }

    const {kind} = data ?? {};

    if (!kind) {
      return;
    }

    switch (kind) {
      case 'papyrs-signin-success':
        await this.onSignInSuccess(data as PostMessageSignInSuccess);
        return;
      case 'papyrs-signin-error':
        this.onSignInError(data as PostMessageSignInError);
    }
  }

  private onSignInError({text}: PostMessageSignInError) {
    this.error(text);
  }

  private async onSignInSuccess(message: PostMessageSignInSuccess) {
    if (!this.ed25519Key) {
      this.error('No Ed25519Key key to decode the identity of the delegation.');
      return;
    }

    const {delegation} = this.decode(message);

    await this.saveToIdb(delegation);

    // TODO: init auth client?
  }

  private decode({
    delegations: messageDelegations,
    userPublicKey
  }: PostMessageSignInSuccess): {identity: Identity; delegation: DelegationChain} {
    const delegations = messageDelegations.map((signedDelegation) => ({
      delegation: new Delegation(
        signedDelegation.delegation.pubkey,
        signedDelegation.delegation.expiration,
        signedDelegation.delegation.targets
      ),
      signature: signedDelegation.signature.buffer as Signature
    }));

    const delegation = DelegationChain.fromDelegations(
      delegations,
      userPublicKey.buffer as DerEncodedPublicKey
    );

    const identity: Identity = DelegationIdentity.fromDelegation(this.ed25519Key, delegation);

    return {delegation, identity};
  }

  private async saveToIdb(delegation: DelegationChain) {
    const customStore = createStore('auth-client-db', 'ic-keyval');

    const bigintStringify = (_key: string, value: unknown): unknown =>
      typeof value === 'bigint' ? `BIGINT::${value}` : value;

    await setMany(
      [
        ['identity', JSON.stringify(this.ed25519Key, bigintStringify)],
        ['delegation', JSON.stringify(delegation.toJSON(), bigintStringify)]
      ],
      customStore
    );
  }

  private error(text: string) {
    this.signInError.emit(text);
  }

  private emitPublicKey = () => {
    this.ed25519Key = Ed25519KeyIdentity.generate();

    this.ref.contentWindow.postMessage(
      {
        kind: 'papyrs-signin-init',
        key: this.ed25519Key.getPublicKey().toDer() as ArrayBuffer
      },
      '*'
    );
  };

  render() {
    return (
      <object
        onLoad={this.emitPublicKey}
        type={'text/html'}
        data={'http://localhost:3335/proxy.html'}
        ref={(el) => (this.ref = el as HTMLObjectElement)}></object>
    );
  }
}
