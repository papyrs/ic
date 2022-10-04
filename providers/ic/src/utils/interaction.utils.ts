import {Identity} from '@dfinity/agent';
import {_SERVICE as DataActor} from '../canisters/data/data.did';
import {idlFactory as DataFactory} from '../canisters/data/data.utils.did';
import {createActor} from './actor.utils';

/**
 * Create data actor without creating the bucket itself - useful for public access on the blog
 */
export const createDataActor = ({
  identity,
  canisterId
}: {
  identity: Identity;
  canisterId: string;
}): Promise<DataActor> =>
  createActor<DataActor>({
    canisterId,
    idlFactory: DataFactory,
    identity
  });
