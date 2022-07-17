import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface BlogPost {
  'id' : string,
  'status' : BlogPostStatus,
  'updated_at' : Time,
  'meta' : Array<number>,
  'fullPath' : string,
  'storageId' : Principal,
  'created_at' : Time,
}
export type BlogPostStatus = { 'open' : null } |
  { 'accepted' : null } |
  { 'declined' : null };
export type BlogPostStatus__1 = { 'open' : null } |
  { 'accepted' : null } |
  { 'declined' : null };
export interface Feed {
  'accept' : ActorMethod<[Principal, string], undefined>,
  'decline' : ActorMethod<[Principal, string], undefined>,
  'list' : ActorMethod<[[] | [FeedFilter]], Array<[string, BlogPost]>>,
  'submit' : ActorMethod<[string, BlogPost], undefined>,
}
export interface FeedFilter { 'status' : [] | [BlogPostStatus__1] }
export type Time = bigint;
export interface _SERVICE extends Feed {}
