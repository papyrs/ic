# 0.1.0 (2022-11-04)

### Features

- update for `storage` API rewritten in Rust
- preserve chunks order in upload
- support for comments and likes on blogspaces

### Build

- bump dependencies including `agent-js` v0.14.0

# Chore

- remove deprecated none timestamp code and functions

# 0.0.24-1 / 0.0.24-2 (2022-09-20)

### Fix

- asset keys might be empty for new users

# 0.0.24 (2022-09-18)

### Features

- compute assets sha256 only for resources (js, css, etc.) and this on the frontend side

### Fix

- remove sha256 computation from backend to prevent issue `Canister 6zvwc-sqaaa-aaaal-aalma-cai exceeded the instruction limit for single message execution.`
- remove `shas` endpoint from "storage" since not needed anymore

# 0.0.23 (2022-09-18)

### Fix

- update meta title on publish with `%%`
- try to upload `/index.html` before sitemap and rss feed to avoid issue `Canister 6zvwc-sqaaa-aaaal-aalma-cai exceeded the instruction limit for single message execution.`

# 0.0.22 (2022-09-18)

### Features

- introduce `sha256` for the content of the "storage" canister to not upload data that already exists
- single sign-on (SSO) components and flow
- I (David) got a new computer - add my new principal ID to the `admin` list in `env.mo`

### Fix

- auth client has to be reset after signout

### Build

- new shortcut script `npm run feed:list`

# 0.0.21 (2022-09-04)

### Build

- improve support for `vite`
- bump dfx

# 0.0.20 (2022-09-01)

### Fix

- agent-js Safari desktop broken sign-in
- generate social image card if user used an uploaded images as first paragraphs

# 0.0.19 (2022-08-26)

### Hot fix 🔥

- new sign-in issue: user cannot be created because updating Indexedb fails as there is no current entity to deconstruct (workaround: hit browser "refresh")
- on publish there might be some timestamps checks issues following proposal #47

# 0.0.18 (2022-08-26)

### Build

- bump `editor` types to support publish `lang` attribute

# 0.0.17 (2022-08-25)

### Features

- prevent data overwrite and timestamps (proposal [#47](https://github.com/papyrs/papyrs/discussions/47))
- upgrade agent-js `v0.13.2` to save the delegation in IndexedDB instead of localstorage

# 0.0.16-1 (2022-07-29)

### Features

- temporary update index.js on publish to roll out last changes for <web-social-share />

# 0.0.16 (2022-07-22)

### Features

- optionally submit blog posts to new "Feed" canister smart contract

# 0.0.15-1 (2022-07-08)

### Features

- add sub `div` to `article` in the landing page

# 0.0.15 (2022-07-08)

### Features

- bump session duration (`delegationIdentityExpiration`) to 4 hours

# 0.0.14-1 (2022-07-02)

### Fix

- handle no blog to update on delete

# 0.0.14 (2022-07-02)

### Features

- use first or second paragraphs image (if exists) as social image for the card - do not upload and publish auto-generated image in such case
- publish social links (twitter etc.) on landing page
- disable auth client `idle` detection

### Fix

- data ids on landing page

### Build

- bump dependencies including `agent-js` v0.12.0

# 0.0.13 (2022-06-17)

### Features

- temporary update CSS to rollout last style improvements

# 0.0.12 (2022-06-17)

### Features

- set delegation identity expiration ("II session") to one hour

### Build

- bump `agent-js` and `nanoid`

# 0.0.11 (2022-06-12)

### Features

- support for `data-src` on images - needed to persist source data of the images such as those generated with Excalidraw
- clean attributes `paragraph_id` and `data-src` on publish

# 0.0.10 (2022-05-23)

### Fix

- do not update `published_at` date if already published - keep original publish date
- remove unused dtd in rss and move `items` as `channel` child

# 0.0.9 (2022-05-22)

### Features

- query all docs / decks entries on publish to refresh the list of published materials ("update list in index.html")
- publish a `sitemap.xml`
- publish a `rss.xml`

### Build

- bump all dependencies

# 0.0.7 - 0.0.8 (2022-04-15)

### Fix

- regex `data-id` for overview

# 0.0.6 (2022-04-15)

### Features

- publish detailed cards for blog entries on overview page

# 0.0.5 (2022-04-14)

### Features

- rename `deckgo-ic-signin` into `ic-signin`
- spacing and spinner display

# 0.0.4 (2022-04-08)

### Features

- transfer cycles from manager to bucket
- replace canister status with query calls for balance
- throw error if storage info are missing to init auth

### Fix

- host and identity to develop the lib locally

# 0.0.3 (2022-04-02)

### Features

- expose admin function to query data and storage canister status
- publish `theme` option

# 0.0.2 (2022-03-19)

- support `cleanNode` that cleans attributes of children of HTML element too

# 0.0.1 (2022-03-19)

### Features

Hello World 👋
