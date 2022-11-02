import type {Interaction} from '@deckdeckgo/editor';
import {LikeData} from '@deckdeckgo/editor';
import {Identity} from '@dfinity/agent';
import {nanoid} from 'nanoid';
import {
  Interaction as InteractionDid,
  PutInteraction,
  _SERVICE as DataBucketActor
} from '../../canisters/data/data.did';
import {fromArray, fromNullable, toArray, toNullable} from '../../utils/did.utils';
import {BucketActor, getDataBucket} from '../../utils/manager.utils';
import {getIdentity} from '../auth/auth.providers';

export const listInteractions = async ({
  key,
  ids
}: {
  key: 'decks' | 'docs';
  ids: string[];
}): Promise<
  Record<string, {countLikes: bigint; like: Interaction | undefined; countComments: bigint}>
> => {
  const identity: Identity | undefined = getIdentity();

  if (!identity) {
    throw new Error('No internet identity to get the count of interactions');
  }

  const {
    actor: {listInteractions}
  }: BucketActor<DataBucketActor> = await getDataBucket({
    identity
  });

  const prefix: string = `/${key}/`;

  const interactions = await listInteractions(ids.map((id: string) => `${prefix}${id}`));

  const convert = async (
    value
  ): Promise<
    Record<string, {countLikes: bigint; like: Interaction | undefined; countComments: bigint}>
  > => {
    const {countLikes, like, countComments} = value[1];

    const nullableLikeDid = fromNullable<InteractionDid>(like);

    const interaction: {countLikes: bigint; like: Interaction | undefined; countComments: bigint} =
      {
        countLikes,
        like: nullableLikeDid !== undefined ? await toInteraction(nullableLikeDid) : undefined,
        countComments
      };

    return {
      [value[0].replace(prefix, '')]: interaction
    };
  };

  const convertedInteractions = await Promise.all(
    interactions.map((interaction) => convert(interaction))
  );

  return convertedInteractions.reduce(
    (acc, value) => ({
      ...acc,
      ...value
    }),
    {} as Record<string, {countLikes: bigint; like: Interaction | undefined; countComments: bigint}>
  );
};

export const toInteraction = async (interaction: InteractionDid): Promise<Interaction> => {
  const data: LikeData = await fromArray<LikeData>(interaction.data);

  return {
    id: interaction.id,
    data,
    created_at: interaction.created_at,
    updated_at: interaction.updated_at,
    author_id: interaction.author.toText()
  };
};

export const initLikePut = async ({
  like,
  identity,
  key,
  id
}: {
  like: Interaction | undefined;
  identity: Identity;
  key: 'decks' | 'docs';
  id: string | undefined;
}): Promise<{putKey: string; putInteraction: PutInteraction}> => {
  const now: Date = new Date();

  const updateLike: Interaction =
    like === undefined
      ? {
          id: nanoid(),
          data: {
            like: true,
            created_at: now,
            updated_at: now
          },
          author_id: identity.getPrincipal().toText()
        }
      : {
          ...like,
          data: {
            ...like.data,
            like: !like.data.like
          }
        };

  const {id: likeId, data, created_at, updated_at} = updateLike;

  return {
    putKey: likeKey({key, id, identity}),
    putInteraction: {
      id: likeId,
      data: await toArray<LikeData>(data),
      author: identity.getPrincipal(),
      created_at: toNullable(created_at as bigint),
      updated_at: toNullable(updated_at as bigint)
    }
  };
};

export const likeKey = ({
  key,
  id,
  identity
}: {
  key: 'decks' | 'docs';
  id: string;
  identity: Identity;
}): string => `/${key}/${id}/likes/${identity.getPrincipal().toText()}`;

export const putInteraction = async ({
  key,
  id,
  interaction
}: {
  key: 'decks' | 'docs';
  id: string | undefined;
  interaction: Interaction | undefined;
  type: 'like' | 'comment';
}): Promise<Interaction> => {
  const identity: Identity | undefined = getIdentity();

  if (!identity) {
    throw new Error('No internet identity to save the interaction');
  }

  const {
    actor: {putInteraction: putInteractionApi}
  }: BucketActor<DataBucketActor> = await getDataBucket({
    identity
  });

  // TODO: type === "comment" ? initComment : initLike
  const {putKey, putInteraction} = await initLikePut({key, id, like: interaction, identity});

  const updatedInteraction: InteractionDid = await putInteractionApi(putKey, putInteraction);

  return toInteraction(updatedInteraction);
};
