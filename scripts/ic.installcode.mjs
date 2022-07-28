#!/usr/bin/env node

import {IDL} from '@dfinity/candid';
import {readFileSync} from 'fs';
import {managerActorIC} from './actors/manager.actors.mjs';
import {fromNullable} from './utils/utils.mjs';

const upgradeBucketData = async ({actor, owner, bucketId, wasmModule}) => {
  console.log(`Upgrading: ${bucketId.toText()}`);

  const arg = IDL.encode([IDL.Principal], [owner]);

  await actor.installCode(bucketId, [...arg], wasmModule);

  console.log(`Done: ${bucketId.toText()}`);
};

const loadWasm = (type) => {
  const buffer = readFileSync(`${process.cwd()}/.dfx/local/canisters/${type}/${type}.wasm`);
  return [...new Uint8Array(buffer)];
};

(async () => {
  const help = process.argv.find((arg) => arg.indexOf('--help') > -1);

  if (help !== undefined) {
    console.log('Options:');
    console.log('--type=data|storage');
    console.log('--list-only');
    return;
  }

  try {
    const actor = await managerActorIC();

    // data or storage
    const type =
      process.argv.find((arg) => arg.indexOf('--type=') > -1)?.replace('--type=', '') ?? 'data';

    const list = await actor.list(type);

    // bucketId is optional in our backend
    const filterList = list.filter(({bucketId}) => fromNullable(bucketId) !== undefined);

    if (filterList.length <= 0) {
      console.log('No buckets found.');
      return;
    }

    const listOnly = process.argv.find((arg) => arg.indexOf('--list-only') > -1) !== undefined;

    if (listOnly) {
      console.log(filterList.map(({bucketId}) => bucketId[0].toText()));
      console.log(`${filterList.length} buckets listed.`)
      return;
    }

    // bucketId[0] -> effective bucketId
    // console.log(bucketId[0].toText());

    const wasmModule = loadWasm(type);

    const promises = filterList.map(({owner, bucketId}) =>
      upgradeBucketData({actor, wasmModule, bucketId: fromNullable(bucketId), owner})
    );
    await Promise.all(promises);
  } catch (e) {
    console.error(e);
  }
})();
