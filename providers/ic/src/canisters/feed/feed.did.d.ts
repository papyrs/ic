import type {ActorMethod} from '@dfinity/agent';
import type {Principal} from '@dfinity/principal';

export interface BlogPost {
  id: string;
  status: BlogPostStatus__1;
  updated_at: Time;
  meta: Array<number>;
  fullPath: string;
  storageId: Principal;
  created_at: Time;
}
export type BlogPostStatus = {open: null} | {accepted: null} | {declined: null};
export type BlogPostStatus__1 = {open: null} | {accepted: null} | {declined: null};
export type BlogPostStatus__2 = {open: null} | {accepted: null} | {declined: null};
export interface Feed {
  accept: ActorMethod<[Principal, string], undefined>;
  decline: ActorMethod<[Principal, string], undefined>;
  list: ActorMethod<[[] | [FeedFilter]], Array<[string, BlogPost]>>;
  submit: ActorMethod<[string, BlogPost], undefined>;
  updateStatus: ActorMethod<[Principal, Principal, string, BlogPostStatus], undefined>;
}
export interface FeedFilter {
  status: [] | [BlogPostStatus__2];
}
export type Time = bigint;
export interface _SERVICE extends Feed {}
