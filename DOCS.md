# Data persistence

To prevent data behind overwritten when user sign-in on a device where an old version of a post is locally stored or if a user is editing the same post on multiple devices at the same time, the `data` canister compares timestamp (`update_at`) before updating data.

If there is no match, then no data are updated on chain.

That is why, while user is editing, data that are saved offline - saved in the browser - does not update the timestamps. Once an update has been successfully committed on chain, then most actual timestamp is persisted to the user client sided database (idb).

The entities saved on client side are implementing following interface:

```
interface Entity<D> {
  id: string;
  data: D;
  created_at?: Time;
  updated_at?: Time;
}
```

`created_at` and `updated_at` are optional because newly created entity - such as adding a paragraph in a post - have no timestamps until persisted on chain.

It is worth to note that the TypeScript definition are optimistic. Following entities would need to implements above interface:

- `User`
- `Deck`
- `Slide`
- `Doc`
- `Paragraph`
- `Template`

However, for historical reason and because these types are shared with DeckDeckGo, they do not explicitly implements at the moment the timestamps information.

e.g.

```
export interface Doc {
    id: string;
    data: DocData;
}
```

In addition, not that the data object of the entity (e.g. above `D` or `DocData`) does also contains timestamps (`{created_at?: Date, updated_at?: Date}`).
These particular information are updated when user add or modify information.

So there is two level of timestamps:

- on chain validation timestamps
- user interacted timestamps

## Pseudo scenario

An example to make above rules a bit more concrete:

- user add a new paragraph -> entity is set in idb

```
{
    id: '1',
    data: {
        created_at: 1,
        updated_at: 1,
    }
}
```

- sync happens in the background -> data is saved on chain

```
{
    id: '1',
    data: {
        created_at: 1,
        updated_at: 1,
    },
    created_at: 2,
    updated_at: 2,
}
```

- user update paragraph -> entity is updated in idb

```
{
    id: '1',
    data: {
        created_at: 1,
        updated_at: 3,
    },
    created_at: 2,
    updated_at: 2,
}
```

- sync happens in the background -> data is saved on chain

```
{
    id: '1',
    data: {
        created_at: 1,
        updated_at: 3,
    },
    created_at: 2,
    updated_at: 4,
}
