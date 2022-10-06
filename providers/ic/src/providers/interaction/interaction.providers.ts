import {Identity} from '@dfinity/agent';
import {_SERVICE as DataBucketActor} from '../../canisters/data/data.did';
import {BucketActor, getDataBucket} from '../../utils/manager.utils';
import {getIdentity} from '../auth/auth.providers';

export const countInteractions = async ({
  key,
  ids
}: {
  key: 'decks' | 'docs';
  ids: string[];
}): Promise<Record<string, {likes: bigint; comments: bigint}>> => {
  const identity: Identity | undefined = getIdentity();

  if (!identity) {
    throw new Error('No internet identity to get the count of interactions');
  }

  const {
    actor: {countInteractions}
  }: BucketActor<DataBucketActor> = await getDataBucket({
    identity
  });

  const prefix: string = `/${key}/`;

  const interactions = await countInteractions(ids.map((id: string) => `${prefix}${id}`));

  return interactions.reduce(
    (acc, value) => ({
      ...acc,
      [value[0].replace(prefix, '')]: value[1]
    }),
    {} as Record<string, {likes: bigint; comments: bigint}>
  );
};
