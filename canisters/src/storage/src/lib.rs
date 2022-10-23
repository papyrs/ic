mod types;
mod store;

use ic_cdk::api::management_canister::main::{CanisterIdRecord, deposit_cycles};
use ic_cdk_macros::{init, update, pre_upgrade, post_upgrade, query};
use ic_cdk::api::{canister_balance128, caller, trap};
use ic_cdk::export::candid::{candid_method, export_service};
use ic_cdk::{storage, id};
use candid::{Principal};
use std::cell::RefCell;
use std::collections::HashMap;

use crate::store::{commit_batch, create_batch, create_chunk, delete_asset, get_asset, get_asset_for_url, get_keys};
use crate::types::{interface::{InitUpload, UploadChunk, CommitBatch, Del}, storage::{AssetKey, State, Chunk, Asset, AssetEncoding, StableState, RuntimeState}, http::{HttpRequest, HttpResponse, HeaderField, StreamingStrategy, StreamingCallbackToken, StreamingCallbackHttpResponse}};

// Rust on the IC introduction by Hamish Peebles:
// https://medium.com/encode-club/encode-x-internet-computer-intro-to-building-on-the-ic-in-rust-video-slides-b496d6baad08
// https://github.com/hpeebles/rust-canister-demo/blob/master/todo/src/lib.rs

thread_local! {
    static STATE: RefCell<State> = RefCell::default();
}

// TODO: https://forum.dfinity.org/t/init-arg-mandatory-in-state/16009/ ?
// I would rather like to have a mandatory { owner: Principal } without having to assign a default value.

#[init]
fn init(user: Principal) {
    STATE.with(|state| {
        *state.borrow_mut() = State {
            stable: StableState {
                user: Some(user),
                assets: HashMap::new(),
            },
            runtime: RuntimeState {
                chunks: HashMap::new(),
                batches: HashMap::new(),
            },
        };
    });
}

#[pre_upgrade]
fn pre_upgrade() {
    STATE.with(|state| storage::stable_save((&state.borrow().stable, )).unwrap());
}

#[post_upgrade]
fn post_upgrade() {
    let (stable, ): (StableState, ) = ic_cdk::storage::stable_restore().unwrap();
    STATE.with(|state| *state.borrow_mut() = State {
        stable,
        runtime: RuntimeState {
            chunks: HashMap::new(),
            batches: HashMap::new(),
        },
    });
}

//
// Http
//

#[query]
#[candid_method(query)]
fn http_request(HttpRequest { method, url, headers: _, body: _ }: HttpRequest) -> HttpResponse {
    if method != "GET" {
        return HttpResponse {
            body: "Method Not Allowed.".as_bytes().to_vec(),
            headers: Vec::new(),
            status_code: 405,
            streaming_strategy: None,
        };
    }

    let result = get_asset_for_url(url);

    match result {
        Ok(Asset { key, headers, encoding }) => {
            return HttpResponse {
                body: encoding.contentChunks[0].clone(),
                headers: headers.clone(),
                status_code: 200,
                streaming_strategy: streaming_strategy(key, &encoding, &headers),
            };
        }
        Err(_) => ()
    }

    return HttpResponse {
        body: "Permission denied. Could not perform this operation.".as_bytes().to_vec(),
        headers: Vec::new(),
        status_code: 405,
        streaming_strategy: None,
    };
}

#[query]
#[candid_method(query)]
fn http_request_streaming_callback(StreamingCallbackToken { token, headers, index, sha256: _, fullPath }: StreamingCallbackToken) -> StreamingCallbackHttpResponse {
    let result = get_asset(fullPath, token);

    match result {
        Err(err) => trap(&*["Streamed asset not found: ", err].join("")),
        Ok(asset) => {
            return StreamingCallbackHttpResponse {
                token: create_token(asset.key, index, &asset.encoding, &headers),
                body: asset.encoding.contentChunks[index].clone(),
            };
        }
    }
}

fn streaming_strategy(key: AssetKey, encoding: &AssetEncoding, headers: &Vec<HeaderField>) -> Option<StreamingStrategy> {
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

fn create_token(key: AssetKey, chunk_index: usize, encoding: &AssetEncoding, headers: &Vec<HeaderField>) -> Option<StreamingCallbackToken> {
    if chunk_index + 1 >= encoding.contentChunks.len() {
        return None;
    }

    Some(StreamingCallbackToken {
        fullPath: key.fullPath,
        token: key.token,
        headers: headers.clone(),
        index: chunk_index + 1,
        sha256: key.sha256,
    })
}

//
// Upload
//

#[allow(non_snake_case)]
#[candid_method(update)]
#[update]
fn initUpload(key: AssetKey) -> InitUpload {
    // TODO: is caller === user

    let batchId: u128 = create_batch(key);
    return InitUpload { batchId };
}

#[allow(non_snake_case)]
#[candid_method(update)]
#[update]
fn uploadChunk(chunk: Chunk) -> UploadChunk {
    // TODO: is caller === user

    let result = create_chunk(chunk);

    match result {
        Ok(chunk_id) => { UploadChunk { chunkId: chunk_id } }
        Err(error) => trap(error)
    }
}

#[allow(non_snake_case)]
#[candid_method(update)]
#[update]
fn commitUpload(commit: CommitBatch) {
    // TODO: is caller === user

    let result = commit_batch(commit);

    match result {
        Ok(_) => (),
        Err(error) => trap(error)
    }
}

//
// List and delete
//

#[allow(non_snake_case)]
#[query]
fn list(folder: Option<String>) -> Vec<AssetKey> {
    // TODO: is caller === user

    get_keys(folder)
}

#[allow(non_snake_case)]
#[update]
fn del(param: Del) {
    // TODO: is caller === user

    let result = delete_asset(param);

    match result {
        Ok(_) => (),
        Err(error) => trap(&*["Asset cannot be deleted: ", error].join(""))
    }
}

//
// Canister mgmt
//

#[allow(non_snake_case)]
#[candid_method(update)]
#[update]
async fn transferFreezingThresholdCycles() {
    let caller = caller();

    // TODO: is caller === manager

    // TODO: determine effective threshold - how few cycles should be retained before deleting the canister?
    // use freezing_threshold_in_cycles? - https://github.com/dfinity/interface-spec/pull/18/files
    // actually above PR was ultimately deleted? - https://forum.dfinity.org/t/minimal-cycles-to-delete-canister/15926

    // Source: https://forum.dfinity.org/t/candid-nat-to-u128/16016
    let balance: u128 = canister_balance128();
    let cycles: u128 = balance - 100_000_000_000u128;

    if cycles > 0 {
        let arg_deposit = CanisterIdRecord { canister_id: caller };
        deposit_cycles(arg_deposit, cycles).await.unwrap();
    }
}

#[allow(non_snake_case)]
#[query]
fn cyclesBalance() -> u128 {
    // TODO: is caller === manager

    canister_balance128()
}

// Generate did files

#[query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    export_service!();
    __export_service()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn save_candid() {
        use std::env;
        use std::fs::write;
        use std::path::PathBuf;

        let dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
        let dir = dir.parent().unwrap().parent().unwrap().join("src").join("storage");
        write(dir.join("storage.did"), export_candid()).expect("Write failed.");
    }
}