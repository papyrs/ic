// Non snake case for backwards compatibility
#![allow(non_snake_case)]

use ic_cdk::{api::{time}};

use crate::{RuntimeState, StableState, STATE, types::storage::{AssetKey, Batch, State, Chunk}};
use crate::types::interface::CommitBatch;
use crate::types::storage::{Asset, AssetEncoding};

//
// Getter, list and delete
//

pub fn get_asset_for_url(url: String) -> Result<Asset, &'static str> {
    if url.is_empty() {
        return Err("No url provided.");
    }

    let split: Vec<&str> = url.split("?token=").collect();
    let full_path: String = ["/", split[0].trim_start_matches('/')].join("");

    // Token protected assets
    if split.len() > 1 {
        let token = split[1];
        return get_asset(full_path, Some(token.to_string()));
    }

    // Map /index.html to / because we are using / as root
    if full_path == "/index.html" {
        return get_asset(String::from("/"), None);
    };

    return get_asset(full_path, None);
}

pub fn get_asset(full_path: String, token: Option<String>) -> Result<Asset, &'static str> {
    STATE.with(|state| get_asset_impl(full_path, token, &state.borrow().stable))
}

fn get_asset_impl(full_path: String, token: Option<String>, state: &StableState) -> Result<Asset, &'static str> {
    let asset = state.assets.get(&full_path);

    match asset {
        None => Err("No asset."),
        Some(asset) => {
            match &asset.key.token {
                None => Ok(asset.clone()),
                Some(assetToken) => get_protected_asset(asset, assetToken, token)
            }
        }
    }
}

fn get_protected_asset(asset: &Asset, assetToken: &String, token: Option<String>) -> Result<Asset, &'static str> {
    match token {
        None => Err("No token provided."),
        Some(token) => {
            if &token == assetToken {
                return Ok(asset.clone());
            }

            return Err("Invalid token.");
        }
    }
}

//
// Upload batch and chunks
//

const BATCH_EXPIRY_NANOS: u64 = 300_000_000_000;

static mut NEXT_BACK_ID: u128 = 0;
static mut NEXT_CHUNK_ID: u128 = 0;

pub fn create_batch(key: AssetKey) -> u128 {
    STATE.with(|state| create_batch_impl(key, &mut state.borrow_mut().runtime))
}

pub fn create_chunk(chunk: Chunk) -> Result<u128, &'static str> {
    STATE.with(|state| create_chunk_impl(chunk, &mut state.borrow_mut().runtime))
}

pub fn commit_batch(commitBatch: CommitBatch) -> Result<&'static str, &'static str> {
    STATE.with(|state| commit_batch_impl(commitBatch, &mut state.borrow_mut()))
}

fn create_batch_impl(key: AssetKey, state: &mut RuntimeState) -> u128 {
    let now = time();

    unsafe {
        clear_expired_batches(state);

        NEXT_BACK_ID = NEXT_BACK_ID + 1;

        state.batches.insert(NEXT_BACK_ID, Batch {
            key,
            expiresAt: now + BATCH_EXPIRY_NANOS,
        });

        NEXT_BACK_ID
    }
}

fn create_chunk_impl(
    Chunk { batchId, content }: Chunk,
    state: &mut RuntimeState,
) -> Result<u128, &'static str> {
    let batch = state.batches.get(&batchId);

    match batch {
        None => Err("Batch not found."),
        Some(b) => {
            let now = time();

            state.batches.insert(batchId, Batch {
                key: b.key.clone(),
                expiresAt: now + BATCH_EXPIRY_NANOS,
            });

            unsafe {
                NEXT_CHUNK_ID = NEXT_CHUNK_ID + 1;

                state.chunks.insert(NEXT_CHUNK_ID, Chunk {
                    batchId,
                    content,
                });

                Ok(NEXT_CHUNK_ID)
            }
        }
    }
}

fn commit_batch_impl(
    commitBatch: CommitBatch,
    state: &mut State,
) -> Result<&'static str, &'static str> {
    let batches = state.runtime.batches.clone();
    let batch = batches.get(&commitBatch.batchId);

    match batch {
        None => Err("No batch to commit."),
        Some(b) => commit_chunks(commitBatch, b, state),
    }
}

fn commit_chunks(
    CommitBatch { chunkIds, batchId, headers }: CommitBatch,
    batch: &Batch,
    state: &mut State,
) -> Result<&'static str, &'static str> {
    let now = time();

    if now > batch.expiresAt {
        clear_expired_batches(&mut state.runtime);
        return Err("Batch did not complete in time. Chunks cannot be committed.");
    }

    let mut content_chunks: Vec<Vec<u8>> = vec!();

    for chunk_id in chunkIds.iter() {
        let chunk = state.runtime.chunks.get(&chunk_id);

        match chunk {
            None => {
                return Err("Chunk does not exist.");
            }
            Some(c) => {
                if batchId != c.batchId {
                    return Err("Chunk not included in the provided batch.");
                }

                content_chunks.push(c.clone().content);
            }
        }
    }

    if content_chunks.len() <= 0 {
        return Err("No chunk to commit.");
    }

    let mut total_length: u128 = 0;

    for chunk in content_chunks.iter() {
        total_length += u128::try_from(chunk.len()).unwrap();
    }

    let key = batch.clone().key;

    state.stable.assets.insert(batch.clone().key.fullPath, Asset {
        key,
        headers,
        encoding: AssetEncoding {
            modified: time(),
            contentChunks: content_chunks,
            totalLength: total_length,
        },
    });

    clear_batch(batchId, chunkIds, &mut state.runtime);

    return Ok("Batch committed.");
}

fn clear_expired_batches(state: &mut RuntimeState) {
    let now = time();

    // Remove expired batches

    let batches = state.batches.clone();

    for (batch_id, batch) in batches.iter() {
        if now > batch.expiresAt {
            state.batches.remove(batch_id);
        }
    }

    // Remove chunk without existing batches (those we just deleted above)

    let chunks = state.chunks.clone();

    for (chunk_id, chunk) in chunks.iter() {
        match state.batches.get(&chunk.batchId) {
            None => {
                state.chunks.remove(chunk_id);
            }
            _ => (),
        }
    }
}

fn clear_batch(batchId: u128, chunkIds: Vec<u128>, state: &mut RuntimeState) {
    for chunk_id in chunkIds.iter() {
        state.chunks.remove(chunk_id);
    }

    state.batches.remove(&batchId);
}