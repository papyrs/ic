import pkgAgent from '@dfinity/agent';
import pkgPrincipal from '@dfinity/principal';
import {readFileSync} from 'fs';
import fetch from 'node-fetch';
import {idlFactory} from '../../.dfx/local/canisters/manager/manager.did.mjs';
import {initIdentity} from './identity.utils.mjs';

const {HttpAgent, Actor} = pkgAgent;
const {Principal} = pkgPrincipal;

const managerPrincipalIC = () => {
  const buffer = readFileSync('./canister_ids.json');
  const {manager} = JSON.parse(buffer.toString('utf-8'));
  return Principal.fromText(manager.ic);
};

const managerPrincipalLocal = () => {
  const buffer = readFileSync('./.dfx/local/canister_ids.json');
  const {manager} = JSON.parse(buffer.toString('utf-8'));
  return Principal.fromText(manager.local);
};

export const managerActorIC = async () => {
  const canisterId = managerPrincipalIC();

  const identity = initIdentity();

  const agent = new HttpAgent({identity, fetch, host: 'https://ic0.app'});

  return Actor.createActor(idlFactory, {
    agent,
    canisterId
  });
};

export const managerActorLocal = async () => {
  const canisterId = managerPrincipalLocal();

  const identity = initIdentity();

  const agent = new HttpAgent({identity, fetch, host: 'http://localhost:8000/'});

  await agent.fetchRootKey();

  return Actor.createActor(idlFactory, {
    agent,
    canisterId
  });
};
