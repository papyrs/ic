use ic_cdk::id;
use serde_bytes::ByteBuf;

use crate::STATE;
use crate::cert::{build_asset_certificate_header};
use crate::types::http::{HeaderField, StreamingCallbackToken, StreamingStrategy};
use crate::types::state::{RuntimeState};
use crate::types::store::{Asset, AssetEncoding, AssetKey};

pub fn streaming_strategy(key: &AssetKey, encoding: &AssetEncoding, headers: &Vec<HeaderField>) -> Option<StreamingStrategy> {
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

pub fn create_token(key: &AssetKey, chunk_index: usize, encoding: &AssetEncoding, headers: &Vec<HeaderField>) -> Option<StreamingCallbackToken> {
    if chunk_index + 1 >= encoding.content_chunks.len() {
        return None;
    }

    Some(StreamingCallbackToken {
        full_path: key.full_path.clone(),
        token: key.token.clone(),
        headers: headers.clone(),
        index: chunk_index + 1,
        sha256: Some(ByteBuf::from(encoding.sha256)),
    })
}

pub fn build_headers(asset: &Asset) -> Result<Vec<HeaderField>, &'static str> {
    let certified_header = build_certified_headers(asset);

    match certified_header {
        Err(err) => Err(err),
        Ok(certified_header) => {
            let mut headers = asset.headers.clone();
            headers.push(certified_header);
            Ok([headers, security_headers()].concat())
        }
    }
}

fn build_certified_headers(asset: &Asset) -> Result<HeaderField, &'static str> {
    STATE.with(|state| build_certified_headers_impl(asset, &state.borrow().runtime))
}

fn build_certified_headers_impl(Asset { key, headers: _, encodings: _ }: &Asset, state: &RuntimeState) -> Result<HeaderField, &'static str> {
    build_asset_certificate_header(&state.asset_hashes, key.full_path.clone())
}

// Source: NNS-dapp
/// List of recommended security headers as per https://owasp.org/www-project-secure-headers/
/// These headers enable browser security features (like limit access to platform apis and set
/// iFrame policies, etc.).
fn security_headers() -> Vec<HeaderField> {
    vec![
        HeaderField("X-Frame-Options".to_string(), "DENY".to_string()),
        HeaderField("X-Content-Type-Options".to_string(), "nosniff".to_string()),
        HeaderField(
            "Strict-Transport-Security".to_string(),
            "max-age=31536000 ; includeSubDomains".to_string(),
        ),
        // "Referrer-Policy: no-referrer" would be more strict, but breaks local dev deployment
        // same-origin is still ok from a security perspective
        HeaderField("Referrer-Policy".to_string(), "same-origin".to_string()),
    ]
}
