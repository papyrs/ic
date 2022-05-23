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
