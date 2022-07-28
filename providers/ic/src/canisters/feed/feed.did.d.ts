import type {ActorMethod} from '@dfinity/agent';
import type {Principal} from '@dfinity/principal';

export interface Feed {
  accept: ActorMethod<[Principal, string], undefined>;
  decline: ActorMethod<[Principal, string], undefined>;
  del: ActorMethod<[Principal, string], undefined>;
  list: ActorMethod<[[] | [PostFilter]], Array<[string, Post]>>;
  listProposals: ActorMethod<[[] | [ProposalFilter]], Array<[string, ProposalEntry]>>;
  submit: ActorMethod<[string, Proposal], undefined>;
}
export interface Post {
  id: string;
  updated_at: Time;
  meta: ProposalMeta;
  pathname: string;
  storageId: canister_id;
  created_at: Time;
}
export interface PostFilter {
  storageId: [] | [canister_id];
}
export interface Proposal {
  id: string;
  meta: ProposalMeta;
  pathname: string;
  storageId: canister_id;
}
export interface ProposalAuthor {
  bio: [] | [string];
  photo_url: [] | [string];
  social: [] | [ProposalAuthorSocial];
  name: string;
}
export interface ProposalAuthorSocial {
  linkedin: [] | [string];
  twitter: [] | [string];
  custom: [] | [string];
  github: [] | [string];
}
export interface ProposalEntry {
  status: ProposalStatus__1;
  updated_at: Time;
  created_at: Time;
  proposal: Proposal__1;
}
export interface ProposalFilter {
  status: [] | [ProposalStatus];
}
export interface ProposalMeta {
  title: string;
  tags: [] | [Array<string>];
  description: [] | [string];
  author: [] | [ProposalAuthor];
}
export type ProposalStatus = {open: null} | {accepted: null} | {declined: null};
export type ProposalStatus__1 = {open: null} | {accepted: null} | {declined: null};
export interface Proposal__1 {
  id: string;
  meta: ProposalMeta;
  pathname: string;
  storageId: canister_id;
}
export type Time = bigint;
export type canister_id = Principal;
export interface _SERVICE extends Feed {}
