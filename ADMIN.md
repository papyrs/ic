# Administration

Some useful command for administration and development

## Review submitted blog posts

The review of the submitted blog posts find place first to get to know if posts were shared. Then it finds also place to avoid SPAM and quickly check that the term of use are met.

### List proposals

```bash
node ./scripts/ic.feed.mjs --list-proposals=open
```

### Accept proposal

```bash
node ./scripts/ic.feed.mjs --accept=storageid___id
```

### List feed

```bash
dfx canister --network ic call "undmj-fiaaa-aaaan-qaocq-cai" list --query "(record {})"
```

### Deploy feed canister

```bash
dfx deploy --argument 'secret' feed
```

For `mainnet` add `--network ic --no-wallet` to the command line.

## Local development

Send cycles to local canister `manager` (useful to create more than two users locally)

```bash
dfx wallet send rrkah-fqaaa-aaaaa-aaaaq-cai 20000000000000
```

## Mainnet

Deploy `manager` to mainnet:

```bash
dfx deploy manager --network ic --no-wallet
```
