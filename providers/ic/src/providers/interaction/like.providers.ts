import type {Interaction, LikeData} from '@deckdeckgo/editor';
import {Identity} from '@dfinity/agent';
import {Interaction as InteractionDid} from '../../canisters/data/data.did';
import {fromArray, fromNullable, toArray, toNullable} from '../../utils/did.utils';
import {getDataBucket} from '../../utils/manager.utils';
import {getIdentity} from '../auth/auth.providers';

export const countLikes = async ({
  key,
  id
}: {
  key: 'decks' | 'docs';
  id: string;
}): Promise<bigint> => {
  const identity: Identity | undefined = getIdentity();

  const {actor} = await getDataBucket({
    identity
  });

  return actor.countLikes(`/${key}/${id}`);
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
  id
}: {
  key: 'decks' | 'docs';
  id: string;
}): Promise<Interaction | undefined> => {
  const identity: Identity | undefined = getIdentity();

  // If not signed in we do not throw an error but ignore the request
  if (!identity) {
    return undefined;
  }

  const {actor} = await getDataBucket({
    identity
  });

  const interaction: InteractionDid | undefined = fromNullable<InteractionDid>(
    await actor.getLike(likeKey({key, id, identity}))
  );

  if (!interaction) {
    return undefined;
  }

  return toInteraction(interaction);
};

export const like = async ({
  key,
  id,
  like
}: {
  key: 'decks' | 'docs';
  id: string | undefined;
  like: Interaction;
}) => {
  const identity: Identity | undefined = getIdentity();

  if (!identity) {
    throw new Error('No internet identity to record the like');
  }

  const {actor} = await getDataBucket({
    identity
  });

  const {id: likeId, data, created_at, updated_at} = like;

  const updatedInteraction: InteractionDid = await actor.putInteraction(
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
