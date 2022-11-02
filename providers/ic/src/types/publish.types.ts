import {Meta} from '@deckdeckgo/editor';

export interface PublishMeta {
  meta: Meta;
  dataId: string;
}

export interface PublishHoistedData {
  data_canister_id: string;
  data_id: string;
}
