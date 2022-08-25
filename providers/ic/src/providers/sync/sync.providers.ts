import {log, Sync, SyncData} from '@deckdeckgo/editor';
import {Identity} from '@dfinity/agent';
import {EnvStore} from '../../stores/env.store';
import {
  syncDeckBackground,
  syncParagraphImage,
  syncSlideChart,
  syncSlideImage
} from '../../sync/window.sync';
import {SyncWindow, SyncWindowEvent} from '../../types/sync.window';
import {uploadWorker} from '../../workers/sync.ic.worker';
import {getIdentity, isAuthenticated} from '../auth/auth.providers';
import { internetIdentityAuth } from "../../utils/identity.utils";
import { DelegationChain } from "@dfinity/identity";
import { isDelegationValid } from "@dfinity/authentication";

// - we cannot use postmessage because of CORS
// - we have to path the function separately in the function's call for serialisation reason (not within the object)
const syncWindow: SyncWindow = async ({msg, data}: SyncWindowEvent) => {
  if (msg === 'deckdeckgo_sync_deck_background') {
    await syncDeckBackground(data);
  }

  if (msg === 'deckdeckgo_sync_slide_image') {
    await syncSlideImage(data);
  }

  if (msg === 'deckdeckgo_sync_slide_chart') {
    await syncSlideChart(data);
  }

  if (msg === 'deckdeckgo_sync_paragraph_image') {
    await syncParagraphImage(data);
  }
};

export const sync: Sync = async ({
  syncData,
  clean
}: {
  syncData: SyncData | undefined;
  userId: string;
  clean: ({syncedAt}: SyncData) => Promise<void>;
}) => {
  const identity: Identity | undefined = getIdentity();

  const [delegationChain, identityIdb] = await internetIdentityAuth();

  if (!identity || !identityIdb) {
    throw new Error('No internet identity to sync data. Please login again.');
  }

  if ((await isAuthenticated()) !== true) {
    throw new Error('Internet identity has expired. Please login again.');
  }

  if (!isDelegationValid(DelegationChain.fromJSON(delegationChain))) {
    throw new Error('Internet identity has expired. Please login again.');
  }

  await uploadWorker(
    {
      syncData,
      env: EnvStore.getInstance().get()
    },
    syncWindow,
    log
  );

  await clean(syncData);
};
