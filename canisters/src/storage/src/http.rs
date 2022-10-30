use ic_cdk::id;
use serde_bytes::ByteBuf;

use crate::STATE;
use crate::cert::{build_asset_certificate_header};
use crate::types::http::{HeaderField, StreamingCallbackToken, StreamingStrategy};
use crate::types::state::{RuntimeState};
use crate::types::store::{Asset, AssetEncoding, AssetKey};

pub fn streaming_strategy(key: AssetKey, encoding: &AssetEncoding, headers: &Vec<HeaderField>) -> Option<StreamingStrategy> {
    let streaming_token: Option<StreamingCallbackToken> = create_token(key, 0, encoding, headers);

    match streaming_token {
        None => None,
        Some(streaming_token) => Some(StreamingStrategy::Callback {
            callback: candid::Func {
                method: "http_request_streaming_callback".to_string(),
                principal: id(),
            },
            token: streaming_token,
        })
    }
}

pub fn create_token(key: AssetKey, chunk_index: usize, encoding: &AssetEncoding, headers: &Vec<HeaderField>) -> Option<StreamingCallbackToken> {
    if chunk_index + 1 >= encoding.content_chunks.len() {
        return None;
    }

    Some(StreamingCallbackToken {
        full_path: key.full_path,
        token: key.token,
        headers: headers.clone(),
        index: chunk_index + 1,
        sha256: Some(ByteBuf::from(encoding.sha256)),
    })
}


pub fn build_certified_headers(asset: &Asset) -> Result<Vec<HeaderField>, &'static str> {
    STATE.with(|state| build_certified_headers_impl(asset, &state.borrow().runtime))
}

fn build_certified_headers_impl(Asset { key, headers, encodings: _ }: &Asset, state: &RuntimeState) -> Result<Vec<HeaderField>, &'static str> {
    let mut certified_headers = headers.clone();

    let certificate_header = build_asset_certificate_header(&state.asset_hashes, key.full_path.clone());

    match certificate_header {
        Err(err) => Err(err),
        Ok(certificate_header) => {
            certified_headers.push(certificate_header);
            Ok(certified_headers)
        }
    }
}
