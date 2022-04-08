#!/usr/bin/env node

import pkgAgent from '@dfinity/agent';
import pkgIdentity from '@dfinity/identity';
import pkgPrincipal from '@dfinity/principal';
import crypto from 'crypto';
import {readFileSync} from 'fs';
import fetch from 'node-fetch';
import {idlFactory} from '../.dfx/local/canisters/manager/manager.did.mjs';
import {idlFactory as nnsIdlFactory} from '../ic/cycles/cycles.utils.did.mjs';
import {E8S_PER_ICP, icpToE8s} from './icp.mjs';

const {Principal} = pkgPrincipal;

const {Secp256k1KeyIdentity} = pkgIdentity;

const {HttpAgent, Actor} = pkgAgent;

const managerPrincipal = () => {
  const buffer = readFileSync('./.dfx/local/canister_ids.json');
  const {manager} = JSON.parse(buffer.toString('utf-8'));
  return Principal.fromText(manager.local);
};

/**
 * ! Replicating the dfx identity in a nodejs script is NOT possible at the moment !
 *
 * See: https://forum.dfinity.org/t/using-dfinity-agent-in-node-js/6169/41
 */
const initIdentity = () => {
  const buffer = readFileSync('/Users/daviddalbusco/.config/dfx/identity/default/identity.pem');
  const key = buffer.toString('utf-8');

  const privateKey = crypto.createHash('sha256').update(key).digest('base64');

  return Secp256k1KeyIdentity.fromSecretKey(Buffer.from(privateKey, 'base64'));
};

const transferCycles = async ({actor, amount, bucketId}) => {
  console.log(`Transfer ${amount} ICP to ${bucketId.toText()}`);

  const trillionRatio = await icpXdrConversionRate();

  const e8ToCycleRatio = trillionRatio / E8S_PER_ICP;
  const cyclesAmount = icpToE8s(amount) * e8ToCycleRatio;

  const oneTrillion = BigInt(1000000) * BigInt(1000000);

  console.log(`Converted to cycles ${Number(cyclesAmount) / Number(oneTrillion)} (${cyclesAmount})`);

  await actor.transferCycles(bucketId, cyclesAmount);

  console.log(`Done.`);
};

const fromNullable = (value) => {
  return value?.[0];
};

const icpXdrConversionRate = async () => {
  const agent = new HttpAgent({fetch, host: 'https://ic0.app'});

  const actor = Actor.createActor(nnsIdlFactory, {
    agent,
    canisterId: 'rkp4c-7iaaa-aaaaa-aaaca-cai'
  });

  const {data} = await actor.get_icp_xdr_conversion_rate();
  const {xdr_permyriad_per_icp} = data;

  const CYCLES_PER_XDR = BigInt(1_000_000_000_000);

  // trillionRatio
  return (xdr_permyriad_per_icp * CYCLES_PER_XDR) / BigInt(10_000);
};

(async () => {
  const help = process.argv.find((arg) => arg.indexOf('--help') > -1);

  if (help !== undefined) {
    console.log('Options:');
    console.log('--canisterId=<canister-id>');
    console.log('--amount=<amount>');
    console.log('Note: amount in ICP');
    return;
  }

  try {
    const managerCanisterId = managerPrincipal();

    const identity = initIdentity();

    const agent = new HttpAgent({identity, fetch, host: 'http://localhost:8000/'});

    await agent.fetchRootKey();

    const actor = Actor.createActor(idlFactory, {
      agent,
      canisterId: managerCanisterId
    });

    const canisterId = process.argv
      .find((arg) => arg.indexOf('--canisterId=') > -1)
      ?.replace('--canisterId=', '');

    if (!canisterId) {
      console.log('No canisterId provided.');
      return;
    }

    const amount = process.argv
      .find((arg) => arg.indexOf('--amount=') > -1)
      ?.replace('--amount=', '');

    if (!amount || amount < 0) {
      console.log('No amount (in ICP) provided.');
      return;
    }

    const [dataBuckets, storageBuckets] = await Promise.all([
      actor.list('data'),
      actor.list('storage')
    ]);
    const bucket = [...dataBuckets, ...storageBuckets].find(
      ({bucketId}) => bucketId[0].toText() === canisterId
    );

    if (bucket === undefined) {
      console.log('CanisterId does not match any bucket.');
      return;
    }

    // canisterId is a string, bucketId is already a principal
    const {bucketId} = bucket;
    await transferCycles({actor, amount, bucketId: fromNullable(bucketId)});
  } catch (e) {
    console.error(e);
  }
})();
