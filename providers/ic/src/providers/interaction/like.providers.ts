import type {Interaction} from '@deckdeckgo/editor';
import {Identity} from '@dfinity/agent';
import {Interaction as InteractionDid} from '../../canisters/data/data.did';
import {fromNullable} from '../../utils/did.utils';
import {createDataActor} from '../../utils/interaction.utils';
import {getIdentity} from '../auth/auth.providers';
import {initLikePut, likeKey, toInteraction} from './interaction.providers';

export const countLikes = async ({
  key,
  id,
  canisterId
}: {
  key: 'decks' | 'docs';
  id: string;
  canisterId: string;
}): Promise<bigint> => {
  const identity: Identity | undefined = getIdentity();

  const {countLikes} = await createDataActor({
    identity,
    canisterId
  });

  return countLikes(`/${key}/${id}`);
};

export const getLike = async ({
  key,
  id,
  canisterId
}: {
  key: 'decks' | 'docs';
  id: string;
  canisterId: string;
}): Promise<Interaction | undefined> => {
  const identity: Identity | undefined = getIdentity();

  // If not signed in we do not throw an error but ignore the request
  if (!identity) {
    return undefined;
  }

  const {getLike} = await createDataActor({
    identity,
    canisterId
  });

  const interaction: InteractionDid | undefined = fromNullable<InteractionDid>(
    await getLike(likeKey({key, id, identity}))
  );

  if (!interaction) {
    return undefined;
  }

  return toInteraction(interaction);
};

export const likeDislike = async ({
  key,
  id,
  like,
  canisterId
}: {
  key: 'decks' | 'docs';
  id: string | undefined;
  like: Interaction | undefined;
  canisterId: string;
}): Promise<Interaction> => {
  const identity: Identity | undefined = getIdentity();

  if (!identity) {
    throw new Error('No internet identity to record the like');
  }

  const {putInteraction: putInteractionApi} = await createDataActor({
    identity,
    canisterId
  });

  const {putKey, putInteraction} = await initLikePut({key, id, like, identity});

  const updatedInteraction: InteractionDid = await putInteractionApi(putKey, putInteraction);

  return toInteraction(updatedInteraction);
};
