#!/usr/bin/env node

import {icpXdrConversionRate} from './services/cycles.services.mjs';
import {managerActorIC} from './utils/actor.utils.mjs';
import {E8S_PER_ICP, icpToE8s} from './utils/icp.utils.mjs';
import {fromNullable} from './utils/utils.mjs';

const transferCycles = async ({actor, amount, bucketId}) => {
  console.log(`Transfer ${amount} ICP to ${bucketId.toText()}`);

  const cyclesAmount = await icpToCycles(amount);

  await actor.transferCycles(bucketId, cyclesAmount);

  console.log(`Done.`);
};

const icpToCycles = async (amount) => {
  const trillionRatio = await icpXdrConversionRate();

  const e8ToCycleRatio = trillionRatio / E8S_PER_ICP;
  const cyclesAmount = icpToE8s(amount) * e8ToCycleRatio;

  const oneTrillion = BigInt(1000000) * BigInt(1000000);

  console.log(
    `${amount} ICP equals ${Number(cyclesAmount) / Number(oneTrillion)} (${cyclesAmount}) cycles`
  );

  return cyclesAmount;
};

(async () => {
  const help = process.argv.find((arg) => arg.indexOf('--help') > -1);

  if (help !== undefined) {
    console.log('Options:');
    console.log('--canisterId=<canister-id>');
    console.log('--amount=<amount>');
    console.log('Note: amount in ICP');
    console.log('--rate');
    return;
  }

  try {
    const rate = process.argv.find((arg) => arg.indexOf('--rate') > -1);

    if (rate) {
      await icpToCycles('1.00');
      return;
    }

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
