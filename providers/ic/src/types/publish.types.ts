import {Meta} from '@deckdeckgo/editor';

export interface PublishMeta {
  meta: Meta;
  dataId: string;
}

export interface PublishCanisterIds {
  data_canister_id: string;
  storage_canister_id: string;
}

export interface PublishIds extends PublishCanisterIds {
  data_id: string;
}
