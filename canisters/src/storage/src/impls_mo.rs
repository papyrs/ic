#![allow(non_snake_case)]

//
// Conversion for migration from Motoko to Rust.
// TODO: to be deleted
//

use ic_cdk::{api::{time}};
use std::collections::HashMap;
use crate::constants::ASSET_ENCODING_KEY_RAW;
use crate::types::store::{Asset, AssetEncoding, AssetKey};
use crate::types_mo::mo::store::MoAsset;

impl From<&MoAsset> for Asset {
    fn from(MoAsset {key: mo_key, headers: mo_headers, encoding: mo_encoding}: &MoAsset) -> Self {
        let mut encodings = HashMap::new();

        encodings.insert(ASSET_ENCODING_KEY_RAW.to_string(), AssetEncoding {
            modified: u64::try_from(mo_encoding.modified.clone().0).unwrap_or(time()),
            content_chunks: mo_encoding.contentChunks.clone(),
            total_length: mo_encoding.totalLength,
        });

        Asset {
           key: AssetKey {
               name: mo_key.name.clone(),
               folder: mo_key.folder.clone(),
               full_path: mo_key.fullPath.clone(),
               token: mo_key.token.clone()
           },
           headers: mo_headers.clone(),
           encodings
       }
    }
}