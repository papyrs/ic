mod types;
mod store;
mod env;
mod utils;
mod impls_mo;
mod types_mo;
mod constants;

use ic_cdk::api::management_canister::main::{CanisterIdRecord, deposit_cycles};
use ic_cdk::api::{canister_balance128, caller, trap};
use ic_cdk_macros::{init, update, pre_upgrade, post_upgrade, query};
use ic_cdk::export::candid::{candid_method, export_service};
use ic_cdk::{storage, id, api};
use candid::{decode_args, Principal};
use std::cell::RefCell;
use std::collections::HashMap;

use crate::constants::ASSET_ENCODING_KEY_RAW;
use crate::store::{commit_batch, create_batch, create_chunk, delete_asset, get_asset, get_asset_for_url, get_keys};
use crate::utils::{principal_not_equal, is_manager};
use crate::types::interface::{InitUpload, UploadChunk, CommitBatch, Del};
use crate::types::state::{State, StableState, RuntimeState, Assets};
use crate::types::store::{AssetKey, Chunk, Asset, AssetEncoding};
use crate::types::http::{HttpRequest, HttpResponse, HeaderField, StreamingStrategy, StreamingCallbackToken, StreamingCallbackHttpResponse};
use crate::types_mo::mo::state::MoState;

thread_local! {
    static STATE: RefCell<State> = RefCell::default();
}

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
    // TODO: uncomment after migration from Motoko to Rust
    // let (stable, ): (StableState, ) = ic_cdk::storage::stable_restore().unwrap();

    // TODO: delete after migration from Motoko to Rust
    // By senior.joinu - not all heroes wear capes
    let mut stable_length_buf = [0u8; std::mem::size_of::<u32>()];
    api::stable::stable_read(0, &mut stable_length_buf);
    let stable_length = u32::from_le_bytes(stable_length_buf); // maybe use from_be_bytes, I don't remember what endianess is candid

    let mut buf = vec![0u8; stable_length as usize];
    api::stable::stable_read(std::mem::size_of::<u32>() as u32, &mut buf);

    let (mo_state, ): (MoState, ) = decode_args(&buf).unwrap();

    let user: Option<Principal> = mo_state.user.clone();
    let assets: Assets = migrate_assets(mo_state);

    let stable: StableState = StableState {
        user,
        assets,
    };

    // Populate state
    STATE.with(|state| *state.borrow_mut() = State {
        stable,
        runtime: RuntimeState {
            chunks: HashMap::new(),
            batches: HashMap::new(),
        },
    });
}

fn migrate_assets(MoState {entries, user: _}: MoState) -> Assets {
    match entries {
        None => HashMap::new(),
        Some(e) => e.iter().map(|(key, mo_asset)|(key.clone(), Asset::from(mo_asset))).collect()
    }
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
        Ok(Asset { key, headers, encodings }) => {
            // We only use raw at the moment and it cannot be None
            let encoding = encodings.get(ASSET_ENCODING_KEY_RAW).unwrap();

            return HttpResponse {
                body: encoding.content_chunks[0].clone(),
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
fn http_request_streaming_callback(StreamingCallbackToken { token, headers, index, sha256: _, full_path }: StreamingCallbackToken) -> StreamingCallbackHttpResponse {
    let result = get_asset(full_path, token);

    match result {
        Err(err) => trap(&*["Streamed asset not found: ", err].join("")),
        Ok(asset) => {
            // We only use raw at the moment and it cannot be None
            let encoding = &asset.encodings.get(ASSET_ENCODING_KEY_RAW).unwrap();

            return StreamingCallbackHttpResponse {
                token: create_token(asset.key, index, &encoding, &headers),
                body: encoding.content_chunks[index].clone(),
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
    if chunk_index + 1 >= encoding.content_chunks.len() {
        return None;
    }

    Some(StreamingCallbackToken {
        full_path: key.full_path,
        token: key.token,
        headers: headers.clone(),
        index: chunk_index + 1,
        // TODO: sha256
        sha256: None,
    })
}

//
// Upload
//

#[allow(non_snake_case)]
#[candid_method(update)]
#[update]
fn initUpload(key: AssetKey) -> InitUpload {
    let user: Principal = STATE.with(|state| state.borrow().stable.user).unwrap();

    if principal_not_equal(caller(), user) {
        trap("User does not have the permission to upload data.");
    }

    let batch_id: u128 = create_batch(key);
    return InitUpload { batch_id };
}

#[allow(non_snake_case)]
#[candid_method(update)]
#[update]
fn uploadChunk(chunk: Chunk) -> UploadChunk {
    let user: Principal = STATE.with(|state| state.borrow().stable.user).unwrap();

    if principal_not_equal(caller(), user) {
        trap("User does not have the permission to a upload any chunks of content.");
    }

    let result = create_chunk(chunk);

    match result {
        Ok(chunk_id) => { UploadChunk { chunk_id } }
        Err(error) => trap(error)
    }
}

#[allow(non_snake_case)]
#[candid_method(update)]
#[update]
fn commitUpload(commit: CommitBatch) {
    let user: Principal = STATE.with(|state| state.borrow().stable.user).unwrap();

    if principal_not_equal(caller(), user) {
        trap("User does not have the permission to commit an upload.");
    }

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
#[candid_method(query)]
#[query]
fn list(folder: Option<String>) -> Vec<AssetKey> {
    let user: Principal = STATE.with(|state| state.borrow().stable.user).unwrap();

    if principal_not_equal(caller(), user) {
        trap("User does not have the permission to list the assets.");
    }

    get_keys(folder)
}

#[allow(non_snake_case)]
#[candid_method(update)]
#[update]
fn del(param: Del) {
    let user: Principal = STATE.with(|state| state.borrow().stable.user).unwrap();

    if principal_not_equal(caller(), user) {
        trap("User does not have the permission to delete an asset.");
    }

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

    if !is_manager(caller) {
        trap("Unauthorized access. Caller is not a manager.");
    }

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
#[candid_method(query)]
#[query]
fn cyclesBalance() -> u128 {
    let caller = caller();
    let user: Principal = STATE.with(|state| state.borrow().stable.user).unwrap();

    if !is_manager(caller) && principal_not_equal(caller, user) {
        trap("No permission to read the balance of the cycles.");
    }

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