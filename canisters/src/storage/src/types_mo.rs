#![allow(non_snake_case)]

//
// Types for migration from Motoko to Rust.
// TODO: to be deleted
//

pub mod mo {
    pub mod state {
        use crate::types_mo::mo::store::MoAsset;
        use candid::{CandidType, Deserialize, Principal};

        #[derive(CandidType, Deserialize)]
        pub struct MoState {
            pub user: Option<Principal>,
            pub entries: Option<Vec<(String, MoAsset)>>,
        }
    }

    pub mod store {
        use crate::types::http::HeaderField;
        use candid::{CandidType, Int};
        use serde::Deserialize;
        use std::clone::Clone;

        #[derive(CandidType, Deserialize, Clone)]
        pub struct MoChunk {
            pub batchId: u128,
            pub content: Vec<u8>,
        }

        #[derive(CandidType, Deserialize, Clone)]
        pub struct MoAssetEncoding {
            pub modified: Int,
            pub contentChunks: Vec<Vec<u8>>,
            pub totalLength: u128,
        }

        #[derive(CandidType, Deserialize, Clone)]
        pub struct MoAssetKey {
            // myimage.jpg
            pub name: String,
            // images
            pub folder: String,
            // /images/myimage.jpg
            pub fullPath: String,
            // ?token=1223-3345-5564-3333
            pub token: Option<String>,
            // The sha256 representation of the content
            pub sha256: Option<Vec<u8>>,
        }

        #[derive(CandidType, Deserialize, Clone)]
        pub struct MoAsset {
            pub key: MoAssetKey,
            pub headers: Vec<HeaderField>,
            pub encoding: MoAssetEncoding,
        }

        #[derive(CandidType, Deserialize, Clone)]
        pub struct MoBatch {
            pub key: MoAssetKey,
            pub expiresAt: u64,
        }
    }
}
