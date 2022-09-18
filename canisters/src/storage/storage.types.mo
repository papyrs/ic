module {

  public type Chunk = {
    batchId : Nat;
    content : [Nat8];
  };

  public type AssetEncoding = {
    modified : Int;
    contentChunks : [[Nat8]];
    totalLength : Nat;
  };

  public type AssetKey = {
    // myimage.jpg
    name : Text;
    // images
    folder : Text;
    // /images/myimage.jpg
    fullPath : Text;
    // ?token=1223-3345-5564-3333
    token : ?Text;
    // The sha256 representation of the content
    sha256 : ?[Nat8];
  };

  public type Asset = {
    key : AssetKey;
    headers : [(Text, Text)];
    encoding : AssetEncoding;
  };

  public type Batch = {
    key : AssetKey;
    expiresAt : Int;
  };

};
