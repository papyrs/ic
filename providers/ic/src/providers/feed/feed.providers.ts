import {
  Deck,
  DeckData,
  DeckSubmitFeed,
  Doc,
  DocData,
  DocSubmitFeed,
  log,
  Meta
} from '@deckdeckgo/editor';
import {Identity} from '@dfinity/agent';
import {_SERVICE as FeedActor} from '../../canisters/feed/feed.did';
import {_SERVICE as StorageBucketActor} from '../../canisters/storage/storage.did';
import {setData} from '../../services/data.services';
import {EnvStore} from '../../stores/env.store';
import {toNullable} from '../../utils/did.utils';
import {createFeedActor} from '../../utils/feed.utils';
import {BucketActor, getStorageBucket} from '../../utils/manager.utils';
import {getIdentity} from '../auth/auth.providers';

export const docSubmitFeed: DocSubmitFeed = async ({doc}: {doc: Doc}): Promise<Doc> => {
  const {
    data: {meta},
    id
  } = doc;

  if (!meta) {
    throw new Error('No meta data to submit to feed');
  }

  await submitFeed({meta, id});

  const updatedDoc: Doc = await updateMetaFeed({key: 'docs', data: doc});

  emitSubmitted({data: updatedDoc, type: 'docFeedSubmitted'});

  return updatedDoc;
};

export const deckSubmitFeed: DeckSubmitFeed = async ({deck}: {deck: Deck}): Promise<Deck> => {
  const {
    data: {meta},
    id
  } = deck;

  if (!meta) {
    throw new Error('No meta data to submit to feed');
  }

  await submitFeed({meta, id});

  const updatedDeck: Deck = await updateMetaFeed({key: 'decks', data: deck});

  emitSubmitted({data: updatedDeck, type: 'deckFeedSubmitted'});

  return updatedDeck;
};

const submitFeed = async ({meta, id}: {meta: Meta; id: string}) => {
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

  const {pathname, title, description, tags, author} = meta;

  if (!pathname) {
    throw new Error('No pathname found. Is the document published?');
  }

  await feedActor.submit(feedSecret, {
    id: id,
    storageId: storageBucketId,
    pathname: meta.pathname,
    meta: {
      title,
      description: toNullable(description),
      tags: toNullable(tags),
      author: toNullable(
        author
          ? {
              name: author.name,
              bio: toNullable(author.bio),
              photo_url: toNullable(author.photo_url),
              social: toNullable(
                author.social
                  ? {
                      twitter: toNullable(author.social.twitter),
                      linkedin: toNullable(author.social.linkedin),
                      github: toNullable(author.social.github),
                      custom: toNullable(author.social.custom)
                    }
                  : undefined
              )
            }
          : undefined
      )
    }
  });

  const t1 = performance.now();
  log({msg: '[submit][done] feed', duration: t1 - t0});
};

const updateMetaFeed = async <T extends Deck | Doc, D extends DeckData | DocData>({
  key,
  data
}: {
  key: 'decks' | 'docs';
  data: T;
}): Promise<T> => {
  log({msg: `[update][start] ${key}`});
  const t0 = performance.now();

  const {data: existingData, id} = data;

  const updatedData: T = await setData<T, D>({
    key: `/docs/${id}`,
    id,
    data: {
      ...existingData,
      meta: {
        ...existingData.meta,
        feed: true
      },
      updated_at: new Date()
    } as D
  });

  const t1 = performance.now();
  log({msg: `[update][done] ${key}`, duration: t1 - t0});

  return updatedData;
};

const emitSubmitted = <T extends Deck | Doc>({
  data,
  type
}: {
  data: T;
  type: 'docFeedSubmitted' | 'deckFeedSubmitted';
}) => {
  const $event: CustomEvent<Doc> = new CustomEvent(type, {
    detail: data
  });
  document.dispatchEvent($event);
};
