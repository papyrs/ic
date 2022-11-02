#!/usr/bin/env node

import {managerActorLocal} from './actors/manager.actors.mjs';
import {loadWasm} from './utils/code.utils.mjs';

const resetWasm = (actor) => actor.storageResetWasm();

const installWasm = async ({actor, type, wasmModule}) => {
  console.log(`Installing ${type} wasm code in manager.`);

  const chunkSize = 700000;

  const upload = async (chunks) => {
    const result = await actor.storageLoadWasm(chunks);
    console.log('Chunks:', result);
  };

  for (let start = 0; start < wasmModule.length; start += chunkSize) {
    const chunks = wasmModule.slice(start, start + chunkSize);
    await upload(chunks);
  }

  console.log(`Installation ${type} done.`);
};

(async () => {
  const wasmModule = await loadWasm('storage');
  const actor = await managerActorLocal();

  // Install wasm in manager
  await resetWasm(actor);
  await installWasm({actor, type: 'storage', wasmModule});
})();
