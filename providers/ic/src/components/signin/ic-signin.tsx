import {
  Component,
  ComponentInterface,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
  State
} from '@stencil/core';
import {signIn} from '../../providers/auth/auth.providers';
import {SignInConfig} from '../../types/signin.types';
import {IconDfinity} from '../icons/dfinity';

@Component({
  tag: 'ic-signin',
  styleUrl: 'ic-signin.scss'
})
export class IcSignin implements ComponentInterface {
  @Prop()
  i18n: Record<string, Record<string, string>>;

  @Prop()
  config: SignInConfig;

  @Prop()
  signIn: () => void;

  @Prop()
  signInSuccess: () => void;

  @Prop()
  signInError: (err?: string) => void;

  @Prop()
  externalSignInState: 'initializing' | 'ready' | 'in-progress' | undefined = undefined;

  @Event()
  inProgress: EventEmitter<boolean>;

  @State()
  private signInInProgress: boolean = false;

  @Event()
  ddgSignInSuccess: EventEmitter<void>;

  @Event()
  ddgSignInError: EventEmitter<string | undefined>;

  private async signUserIn() {
    if (this.signIn) {
      this.signIn();
      return;
    }

    this.inProgress.emit(true);
    this.signInInProgress = true;

    const signInSuccess: () => void = this.signInSuccess || (() => this.ddgSignInSuccess.emit());
    const signInError: (err?: string) => void =
      this.signInError || ((err?: string) => this.ddgSignInError.emit(err));

    await signIn({
      onSuccess: signInSuccess,
      onError: (err?: string) => {
        this.signInInProgress = false;

        signInError(err);
      }
    });
  }

  private isDisabled(): boolean {
    return (
      this.signInInProgress || ['initializing', 'in-progress'].includes(this.externalSignInState)
    );
  }

  render() {
    return (
      <Host>
        {this.renderSpinner()}

        {this.renderAction()}
        {this.renderTerms()}
      </Host>
    );
  }

  private renderSpinner() {
    return (
      <div class={`spinner ${!this.isDisabled() ? 'hidden' : ''}`}>
        <slot name="spinner" />
      </div>
    );
  }

  private renderAction() {
    if (this.isDisabled()) {
      return undefined;
    }

    return (
      <button onClick={async () => await this.signUserIn()}>
        <IconDfinity />
        {this.i18n?.sign_in.internet_identity}
      </button>
    );
  }

  private renderTerms() {
    if (this.isDisabled()) {
      return undefined;
    }

    const {terms, privacy} = this.config || {};

    return (
      <p class="terms">
        By continuing, you are indicating that you accept our{' '}
        <a href={terms} rel="noopener norefferer" target="_blank">
          {this.i18n?.links.terms_of_use}
        </a>{' '}
        and{' '}
        <a href={privacy} rel="noopener norefferer" target="_blank">
          {this.i18n?.links.privacy_policy}
        </a>
        .
      </p>
    );
  }
}
