import pkgAgent from '@dfinity/agent';
import pkgPrincipal from '@dfinity/principal';
import {readFileSync} from 'fs';
import fetch from 'node-fetch';
import {idlFactory} from '../../.dfx/local/canisters/feed/feed.did.mjs';
import {initIdentity} from '../utils/identity.utils.mjs';

const {HttpAgent, Actor} = pkgAgent;
const {Principal} = pkgPrincipal;

const feedPrincipalIC = () => {
  const buffer = readFileSync('./canister_ids.json');
  const {feed} = JSON.parse(buffer.toString('utf-8'));
  return Principal.fromText(feed.ic);
};

const feedPrincipalLocal = () => {
  const buffer = readFileSync('./.dfx/local/canister_ids.json');
  const {feed} = JSON.parse(buffer.toString('utf-8'));
  return Principal.fromText(feed.local);
};

export const feedActorIC = async () => {
  const canisterId = feedPrincipalIC();

  const identity = initIdentity();

  const agent = new HttpAgent({identity, fetch, host: 'https://ic0.app'});

  return Actor.createActor(idlFactory, {
    agent,
    canisterId
  });
};

export const feedActorLocal = async () => {
  const canisterId = feedPrincipalLocal();

  const identity = initIdentity();

  const agent = new HttpAgent({identity, fetch, host: 'http://localhost:8000/'});

  await agent.fetchRootKey();

  return Actor.createActor(idlFactory, {
    agent,
    canisterId
  });
};
