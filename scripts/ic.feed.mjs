import {feedActorLocal} from './actors/feed.actors.mjs';
import pkgPrincipal from '@dfinity/principal';

const {Principal} = pkgPrincipal;

// See Motoko proposal store code
const KEY_SEPARATOR = '___';

const publishUrl = ({key, local}) => {
  const [storageId, _id] = key.split(KEY_SEPARATOR);

  if (local) {
    return `http://${storageId}.localhost:8000`;
  }

  return `https://${storageId}.raw.ic0.app`;
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
          proposal: {meta: {title, description, tags}, pathname}
        }
      ]) => ({
        key,
        url: `${publishUrl({key, local: true})}${pathname}`,
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

  const key =
    process.argv
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
}

(async () => {
  const help = process.argv.find((arg) => arg.indexOf('--help') > -1);

  if (help !== undefined) {
    console.log('Options:');
    console.log('--list-proposals=open|accepted|declined');
    console.log('--accept=key');
    console.log('--decline=key');
    return;
  }

  try {
    const actor = await feedActorLocal();

    const list = process.argv.find((arg) => arg.indexOf('--list-proposals') > -1) !== undefined;

    if (list) {
      const type =
        process.argv
          .find((arg) => arg.indexOf('--list-proposals=') > -1)
          ?.replace('--list-proposals=', '') ?? 'open';

      await listProposals({type, actor});

      return;
    }

    await updateStatus({actor, action: 'accept'});
    await updateStatus({actor, action: 'decline'});
  } catch (e) {
    console.error(e);
  }
})();
