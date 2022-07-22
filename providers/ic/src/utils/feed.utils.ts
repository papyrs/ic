import { Identity } from "@dfinity/agent";
import { _SERVICE as FeedActor } from "../canisters/feed/feed.did";
import { createActor } from "./actor.utils";
import { EnvStore } from "../stores/env.store";
import {idlFactory as FeedFactory} from '../canisters/feed/feed.utils.did';

export const createFeedActor = ({identity}: {identity: Identity}): Promise<FeedActor> => {
  return createActor<FeedActor>({
    canisterId: EnvStore.getInstance().get().feedCanisterId,
    idlFactory: FeedFactory,
    identity
  });
};
