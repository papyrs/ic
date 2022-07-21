import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface BlogPost {
  'id' : string,
  'status' : BlogPostStatus__1,
  'updated_at' : Time,
  'meta' : Array<number>,
  'storageId' : Principal,
  'created_at' : Time,
}
export type BlogPostStatus = { 'open' : null } |
  { 'accepted' : null } |
  { 'declined' : null };
export type BlogPostStatus__1 = { 'open' : null } |
  { 'accepted' : null } |
  { 'declined' : null };
export interface BlogPostSubmission {
  'id' : string,
  'meta' : Array<number>,
  'storageId' : Principal,
}
export interface Feed {
  'accept' : ActorMethod<[Principal, string], undefined>,
  'decline' : ActorMethod<[Principal, string], undefined>,
  'list' : ActorMethod<[[] | [FeedFilter]], Array<[string, BlogPost]>>,
  'submit' : ActorMethod<[string, BlogPostSubmission], undefined>,
}
export interface FeedFilter { 'status' : [] | [BlogPostStatus] }
export type Time = bigint;
export interface _SERVICE extends Feed {}
