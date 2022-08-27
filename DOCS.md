# Data persistence

To prevent data being overwritten when user sign-in on a device where an old version of a post is locally stored or if a user is editing the same post on multiple devices at the same time, the `data` canister compares timestamp (`update_at`) before updating data.

If there is no match, then no data are updated on chain.

That is why, while user is editing, data that are saved offline - saved in the browser - does not update the timestamps. Once an update has been successfully committed on chain, then most actual timestamp is persisted to the user client sided database (idb).

The records saved on client side are implementing following interface:

```
interface Record<D> {
  id: string;
  data?: D;
  created_at?: Time;
  updated_at?: Time;
}
```

Where `Record` is one of the following types:

- `User`
- `Deck`
- `Slide`
- `Doc`
- `Paragraph`
- `Template`

Timestamps - `created_at` and `updated_at` - are optional because newly created record - such as adding a paragraph in a post - have no timestamps until persisted on chain.

Content - `data` - is optional because when a paragraph is deleted, the record is kept in indexedb (with content - `data` - removed) as long as it has not been removed on chain as well. When done, the record in idb is finally wiped out.

In addition, note that the data object of the entity (e.g. above `D` - e.g. `DocData`) does also contains timestamps (`{created_at?: Date, updated_at?: Date}`).
These particular information are updated when user add or modify information.

So there are two level of timestamps:

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
```
