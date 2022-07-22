#!/usr/bin/env node

import {managerActorIC} from './actors/manager.actors.mjs';
import {fromNullable} from './utils/utils.mjs';

const transferCycles = async ({actor, amount, bucketId}) => {
  const oneTrillion = BigInt(1000000) * BigInt(1000000);
  const cyclesAmount = parseFloat(amount) * Number(oneTrillion);

  console.log(`Transfer ${amount} (${cyclesAmount}) cycles to ${bucketId.toText()}`);

  await actor.transferCycles(bucketId, cyclesAmount);

  console.log(`Done.`);
};

(async () => {
  const help = process.argv.find((arg) => arg.indexOf('--help') > -1);

  if (help !== undefined) {
    console.log('Options:');
    console.log('--canisterId=<canister-id>');
    console.log('--amount=<amount>');
    console.log('Note: amount in trillion cycles - e.g. 13.5171 to transfer 13517100000000');
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
