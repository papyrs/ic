#!/usr/bin/env node

import {IDL} from '@dfinity/candid';
import {managerActorLocal} from './actors/manager.actors.mjs';
import {loadWasm} from './utils/code.utils.mjs';
import {fromNullable} from './utils/utils.mjs';

// TODO: this works until the wasm gets to big, then I'll need to chunk upload
const upgradeBucketData = async ({actor, owner, bucketId, wasmModule}) => {
  console.log(`Upgrading: ${bucketId.toText()}`);

  const arg = IDL.encode([IDL.Principal], [owner]);

  await actor.installCode(bucketId, [...arg], wasmModule);

  console.log(`Done: ${bucketId.toText()}`);
};

(async () => {
  const help = process.argv.find((arg) => arg.indexOf('--help') > -1);

  if (help !== undefined) {
    console.log('Options:');
    console.log('--type=data|storage');
    console.log('--list-only');
    console.log('--filter=canister_ids (comma separated list)');
    return;
  }

  try {
    const actor = await managerActorLocal();

    // data or storage
    const type =
      process.argv.find((arg) => arg.indexOf('--type=') > -1)?.replace('--type=', '') ?? 'data';

    const filter =
      process.argv
        .find((arg) => arg.indexOf('--filter=') > -1)
        ?.replace('--filter=', '')
        .split(',') ?? [];

    const list = await actor.list(type);

    // bucketId is optional in our backend
    const filterList = list
      .filter(({bucketId}) => fromNullable(bucketId) !== undefined)
      .filter(({bucketId}) => filter.length === 0 || filter.includes(bucketId[0].toText()));

    if (filterList.length <= 0) {
      console.log('No buckets found.');
      return;
    }

    const listOnly = process.argv.find((arg) => arg.indexOf('--list-only') > -1) !== undefined;

    if (listOnly) {
      console.log(filterList.map(({bucketId}) => bucketId[0].toText()));
      console.log(`${filterList.length} buckets listed.`);
      return;
    }

    // bucketId[0] -> effective bucketId
    // console.log(bucketId[0].toText());

    const wasmModule = await loadWasm(type);

    // Execute upgrade 10 canisters at a time - just in a preventive case to not charge too much the manager
    // 377 canisters upgraded in 5 minutes - Aug. 25 2022 08:35-08.40
    const chunkSize = 10;
    for (let i = 0; i < filterList.length; i += chunkSize) {
      const chunk = filterList.slice(i, i + chunkSize);

      const promises = chunk.map(({owner, bucketId}) =>
        upgradeBucketData({actor, wasmModule, bucketId: fromNullable(bucketId), owner})
      );
      await Promise.all(promises);
    }
  } catch (e) {
    console.error(e);
  }
})();
