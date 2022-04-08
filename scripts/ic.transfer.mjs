#!/usr/bin/env node

import pkgAgent from '@dfinity/agent';
import fetch from 'node-fetch';
import {idlFactory as nnsIdlFactory} from '../ic/cycles/cycles.utils.did.mjs';
import {managerActorIC} from './utils/actor.utils';
import {fromNullable} from './utils/ic.utils';
import {E8S_PER_ICP, icpToE8s} from './utils/icp.utils.mjs';

const {HttpAgent, Actor} = pkgAgent;

const transferCycles = async ({actor, amount, bucketId}) => {
  console.log(`Transfer ${amount} ICP to ${bucketId.toText()}`);

  const trillionRatio = await icpXdrConversionRate();

  const e8ToCycleRatio = trillionRatio / E8S_PER_ICP;
  const cyclesAmount = icpToE8s(amount) * e8ToCycleRatio;

  const oneTrillion = BigInt(1000000) * BigInt(1000000);

  console.log(
    `Converted to cycles ${Number(cyclesAmount) / Number(oneTrillion)} (${cyclesAmount})`
  );

  await actor.transferCycles(bucketId, cyclesAmount);

  console.log(`Done.`);
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

    const actor = await managerActorIC();

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
