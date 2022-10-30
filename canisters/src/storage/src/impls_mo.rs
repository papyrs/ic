#![allow(non_snake_case)]

//
// Conversion for migration from Motoko to Rust.
// TODO: to be deleted
//

use ic_cdk::{api::{time}};
use std::collections::HashMap;
use sha2::{Digest, Sha256};
use crate::constants::ASSET_ENCODING_KEY_RAW;
use crate::types::store::{Asset, AssetEncoding, AssetKey};
use crate::types_mo::mo::store::MoAsset;

impl From<&MoAsset> for Asset {
    fn from(MoAsset {key: mo_key, headers: mo_headers, encoding: mo_encoding}: &MoAsset) -> Self {
        let mut encodings = HashMap::new();

        // Calculate sha256 - Duplicate implementation to preserve easily the original Motoko "modified" and "total_length" information
        let mut hasher = Sha256::new();
        for chunk in mo_encoding.contentChunks.iter() {
            hasher.update(chunk);
        }
        let sha256 = hasher.finalize().into();

        encodings.insert(ASSET_ENCODING_KEY_RAW.to_string(), AssetEncoding {
            modified: u64::try_from(mo_encoding.modified.clone().0).unwrap_or(time()),
            content_chunks: mo_encoding.contentChunks.clone(),
            total_length: mo_encoding.totalLength,
            sha256
        });

        Asset {
           key: AssetKey {
               name: mo_key.name.clone(),
               folder: mo_key.folder.clone(),
               full_path: mo_key.fullPath.clone(),
               token: mo_key.token.clone(),
               sha256: mo_key.sha256.clone()
           },
           headers: mo_headers.clone(),
           encodings
       }
    }
}