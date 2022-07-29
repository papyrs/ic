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
