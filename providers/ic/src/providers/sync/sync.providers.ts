import {log, Sync, SyncData} from '@deckdeckgo/editor';
import {Identity} from '@dfinity/agent';
import {DelegationChain, isDelegationValid} from '@dfinity/identity';
import {EnvStore} from '../../stores/env.store';
import {
  syncDeckBackground,
  syncParagraphImage,
  syncSlideChart,
  syncSlideImage
} from '../../sync/window.sync';
import {SyncWindow, SyncWindowEvent} from '../../types/sync.window';
import {internetIdentityAuth} from '../../utils/identity.utils';
import {uploadWorker} from '../../workers/sync.ic.worker';
import {getIdentity, isAuthenticated} from '../auth/auth.providers';

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
    log({msg: '[identity] no internet identity to sync data. Please login again.', level: 'error'});
    throw new Error('No internet identity to sync data. Please login again.');
  }

  if ((await isAuthenticated()) !== true) {
    log({msg: '[identity] internet identity has expired. Please login again.', level: 'error'});
    throw new Error('Internet identity has expired. Please login again.');
  }

  if (!isDelegationValid(DelegationChain.fromJSON(delegationChain))) {
    log({msg: '[identity] delegation has expired. Please login again.', level: 'error'});
    throw new Error('Delegation has expired. Please login again.');
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
