import pkgPrincipal from '@dfinity/principal';
import {feedActorIC} from './actors/feed.actors.mjs';

const {Principal} = pkgPrincipal;

// See Motoko proposal store code
const KEY_SEPARATOR = '___';

const publishUrl = ({key, local}) => {
  const [storageId, _id] = key.split(KEY_SEPARATOR);

  if (local) {
    return `http://${storageId}.localhost:8000`;
  }

  return `https://${storageId}.raw.icp0.io`;
};

const listProposals = async ({type, actor}) => {
  const status = {};
  status[type] = null;

  const filter = {
    status: [
      {
        ...status
      }
    ]
  };

  const proposals = await actor.listProposals([filter]);

  console.log(
    `List ${proposals.length} proposals:`,
    proposals.map(
      ([
        key,
        {
          proposal: {
            meta: {title, description, tags},
            pathname
          }
        }
      ]) => ({
        key,
        url: `${publishUrl({key, local: false})}${pathname}`,
        title,
        description: description?.[0],
        tags: tags?.[0]
      })
    )
  );
};

const updateStatus = async ({actor, action}) => {
  const actionCmd = process.argv.find((arg) => arg.indexOf(`--${action}`) > -1) !== undefined;

  if (!actionCmd) {
    return;
  }

  const key = process.argv
    .find((arg) => arg.indexOf(`--${action}`) > -1)
    ?.replace(`--${action}=`, '');

  if (!key || key === '') {
    throw new Error('Key is mandatory');
  }

  const [storage, id] = key.split(KEY_SEPARATOR);

  switch (action) {
    case 'accept':
      await actor.accept(Principal.fromText(storage), id);
      break;
    case 'decline':
      await actor.decline(Principal.fromText(storage), id);
      break;
    default:
      throw new Error('Action not supported.');
  }
};

const deletePost = async ({actor}) => {
  const key = process.argv.find((arg) => arg.indexOf(`--del`) > -1)?.replace(`--del=`, '');

  if (!key || key === '') {
    throw new Error('Key is mandatory');
  }

  const [storage, id] = key.split(KEY_SEPARATOR);

  await actor.del(Principal.fromText(storage), id);
};

(async () => {
  const help = process.argv.find((arg) => arg.indexOf('--help') > -1);

  if (help !== undefined) {
    console.log('Options:');
    console.log('--list-proposals=open|accepted|declined');
    console.log('--accept=key');
    console.log('--decline=key');
    console.log('--del=key');
    return;
  }

  try {
    const actor = await feedActorIC();

    const list = process.argv.find((arg) => arg.indexOf('--list-proposals') > -1) !== undefined;

    if (list) {
      const type =
        process.argv
          .find((arg) => arg.indexOf('--list-proposals=') > -1)
          ?.replace('--list-proposals=', '') ?? 'open';

      await listProposals({type, actor});

      return;
    }

    const del = process.argv.find((arg) => arg.indexOf('--del') > -1) !== undefined;

    if (del) {
      await deletePost({actor});
    }

    await updateStatus({actor, action: 'accept'});
    await updateStatus({actor, action: 'decline'});
  } catch (e) {
    console.error(e);
  }
})();
