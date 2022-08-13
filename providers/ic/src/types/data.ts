import type {Time} from '../canisters/data/data.did';

export interface IdbData<D> {
  id: string;
  data: D;
  created_at?: Time;
  updated_at?: Time;
}
