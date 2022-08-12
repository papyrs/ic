import {Time} from '../canisters/data/data.did';

export interface Entity<D> {
  id: string;
  data: D;
  created_at?: Time;
  updated_at?: Time;
}
