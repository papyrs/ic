import Text "mo:base/Text";
import Time "mo:base/Time";
import Blob "mo:base/Blob";

import IC "../types/ic.types";

module {

  /**
     * Blog post status is meant to prevent SPAM and submission that does not comply with the terms of use
     */
  public type ProposalStatus = {
    #open;
    #declined;
    #accepted;
  };

  /**
     * The blog post proposal submitted by the user
     */
  public type Proposal = {
    id : Text;
    storageId : IC.canister_id;
    pathname : Text;
    meta : ProposalMeta;
  };

  public type ProposalMeta = {
    title : Text;
    description : ?Text;
    tags : ?[Text];
    author : ?ProposalAuthor;
  };

  public type ProposalAuthor = {
    name : Text;
    bio : ?Text;
    photo_url : ?Text;
    social : ?ProposalAuthorSocial;
  };

  public type ProposalAuthorSocial = {
    twitter : ?Text;
    linkedin : ?Text;
    github : ?Text;
    custom : ?Text;
  };

  /**
     * The type saved in memory for the proposal
     */
  public type ProposalEntry = {
    proposal : Proposal;

    status : ProposalStatus;

    created_at : Time.Time;
    updated_at : Time.Time;
  };
};
