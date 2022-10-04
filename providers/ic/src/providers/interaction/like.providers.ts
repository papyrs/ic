import type {Interaction, LikeData} from '@deckdeckgo/editor';
import {Identity} from '@dfinity/agent';
import {Interaction as InteractionDid} from '../../canisters/data/data.did';
import {fromArray, fromNullable, toArray, toNullable} from '../../utils/did.utils';
import {createDataActor} from '../../utils/interaction.utils';
import {getIdentity} from '../auth/auth.providers';

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

const likeKey = ({
  key,
  id,
  identity
}: {
  key: 'decks' | 'docs';
  id: string;
  identity: Identity;
}): string => `/${key}/${id}/likes/${identity.getPrincipal().toText()}`;

const toInteraction = async (interaction: InteractionDid): Promise<Interaction> => {
  const data: LikeData = await fromArray<LikeData>(interaction.data);

  return {
    id: interaction.id,
    data,
    created_at: interaction.created_at,
    updated_at: interaction.updated_at,
    author_id: interaction.author.toText()
  };
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

export const like = async ({
  key,
  id,
  like,
  canisterId
}: {
  key: 'decks' | 'docs';
  id: string | undefined;
  like: Interaction;
  canisterId: string;
}) => {
  const identity: Identity | undefined = getIdentity();

  if (!identity) {
    throw new Error('No internet identity to record the like');
  }

  const {putInteraction} = await createDataActor({
    identity,
    canisterId
  });

  const {id: likeId, data, created_at, updated_at} = like;

  const updatedInteraction: InteractionDid = await putInteraction(
    likeKey({key, id, identity}),
    {
      id: likeId,
      data: await toArray<LikeData>(data),
      author: identity.getPrincipal(),
      created_at: toNullable(created_at as bigint),
      updated_at: toNullable(updated_at as bigint)
    }
  );

  return toInteraction(updatedInteraction);
};
