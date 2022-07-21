import { log, Meta } from "@deckdeckgo/editor";
import {Identity} from '@dfinity/agent';
import {_SERVICE as FeedActor} from '../../canisters/feed/feed.did';
import {_SERVICE as StorageBucketActor} from '../../canisters/storage/storage.did';
import {EnvStore} from '../../stores/env.store';
import {toArray} from '../../utils/did.utils';
import {createFeedActor} from '../../utils/feed.utils';
import {BucketActor, getStorageBucket} from '../../utils/manager.utils';
import {getIdentity} from '../auth/auth.providers';

export const submitFeed = async ({meta, id}: {meta: Meta; id: string}) => {
  const identity: Identity | undefined = getIdentity();

  if (!identity) {
    throw new Error('No internet identity to submit entry to feed');
  }

  const {bucketId: storageBucketId}: BucketActor<StorageBucketActor> = await getStorageBucket({
    identity
  });

  if (!storageBucketId) {
    throw new Error('No storage found. Is the document published?');
  }

  log({msg: '[submit][start] feed'});
  const t0 = performance.now();

  const feedActor: FeedActor = await createFeedActor({identity});

  const feedSecret: string = EnvStore.getInstance().get().feedSecret;

  await feedActor.submit(feedSecret, {
    id: id,
    storageId: storageBucketId,
    meta: await toArray(meta)
  });

  const t1 = performance.now();
  log({msg: '[submit][done] feed', duration: t1 - t0});
};
