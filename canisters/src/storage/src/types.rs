pub mod state {
    use std::collections::HashMap;
    use candid::{CandidType, Deserialize, Principal};
    use crate::types::store::{Asset, Batch, Chunk};

    pub type Batches = HashMap<u128, Batch>;
    pub type Chunks = HashMap<u128, Chunk>;
    pub type Assets = HashMap<String, Asset>;

    #[derive(Default, Clone)]
    pub struct State {
        pub stable: StableState,
        pub runtime: RuntimeState,
    }

    #[derive(Default, CandidType, Deserialize, Clone)]
    pub struct StableState {
        pub user: Option<Principal>,
        pub assets: Assets,
    }

    #[derive(Default, Clone)]
    pub struct RuntimeState {
        pub chunks: Chunks,
        pub batches: Batches,
    }
}

pub mod store {
    use candid::{CandidType};
    use serde::Deserialize;
    use std::clone::Clone;
    use std::collections::HashMap;
    use crate::types::http::HeaderField;

    #[derive(CandidType, Deserialize, Clone)]
    pub struct Chunk {
        pub batch_id: u128,
        pub content: Vec<u8>,
    }

    #[derive(CandidType, Deserialize, Clone)]
    pub struct AssetEncoding {
        pub modified: u64,
        pub content_chunks: Vec<Vec<u8>>,
        pub total_length: u128,
        // TODO sha256
    }

    #[derive(CandidType, Deserialize, Clone)]
    pub struct AssetKey {
        // myimage.jpg
        pub name: String,
        // images
        pub folder: String,
        // /images/myimage.jpg
        pub full_path: String,
        // ?token=1223-3345-5564-3333
        pub token: Option<String>,
        // A sha256 representation of the raw content calculated on the frontend side.
        // This is used to easily detects - without the need to download all the chunks - if a resource of the kit should be updated or not when publishing.
        pub sha256: Option<Vec<u8>>,
    }

    #[derive(CandidType, Deserialize, Clone)]
    pub struct Asset {
        pub key: AssetKey,
        pub headers: Vec<HeaderField>,
        // Currently we use only raw data but we might use encoded chunks (gzip, compress) in the future to improve performance.
        // At the same time we want to avoid to have to map the state on post-upgrade when we will do so. Therefore we use a convenient HashMap instead of a struct.
        pub encodings: HashMap<String, AssetEncoding>,
    }

    #[derive(CandidType, Deserialize, Clone)]
    pub struct Batch {
        pub key: AssetKey,
        pub expires_at: u64,
    }
}

pub mod interface {
    use candid::{CandidType, Deserialize};

    use crate::types::http::HeaderField;

    #[derive(CandidType)]
    pub struct InitUpload {
        pub batch_id: u128,
    }

    #[derive(CandidType)]
    pub struct UploadChunk {
        pub chunk_id: u128,
    }

    #[derive(CandidType, Deserialize)]
    pub struct CommitBatch {
        pub batch_id: u128,
        pub headers: Vec<HeaderField>,
        pub chunk_ids: Vec<u128>,
    }

    #[derive(CandidType, Deserialize)]
    pub struct Del {
        pub full_path: String,
        pub token: Option<String>,
    }
}

pub mod http {
    use candid::{CandidType, Deserialize, Func};

    #[derive(CandidType, Deserialize, Clone)]
    pub struct HeaderField(String, String);

    #[derive(CandidType, Deserialize, Clone)]
    pub struct HttpRequest {
        pub url: String,
        pub method: String,
        pub headers: Vec<HeaderField>,
        pub body: Vec<u8>,
    }

    #[derive(CandidType, Deserialize, Clone)]
    pub struct HttpResponse {
        pub body: Vec<u8>,
        pub headers: Vec<HeaderField>,
        pub status_code: u16,
        pub streaming_strategy: Option<StreamingStrategy>,
    }

    #[derive(CandidType, Deserialize, Clone)]
    pub enum StreamingStrategy {
        Callback {
            token: StreamingCallbackToken,
            callback: Func,
        },
    }

    #[derive(CandidType, Deserialize, Clone)]
    pub struct StreamingCallbackToken {
        pub full_path: String,
        pub token: Option<String>,
        pub headers: Vec<HeaderField>,
        pub sha256: Option<Vec<u8>>,
        pub index: usize,
    }

    #[derive(CandidType, Deserialize, Clone)]
    pub struct StreamingCallbackHttpResponse {
        pub body: Vec<u8>,
        pub token: Option<StreamingCallbackToken>,
    }
}
