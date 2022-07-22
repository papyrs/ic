import { feedActorLocal } from "./actors/feed.actors.mjs";

const publishUrl = ({key, local}) => {
  const [storageId, _id] = key.split('___');

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
    proposals.map(([key, {proposal: {pathname}}]) => `${publishUrl({key, local: true})}${pathname}`)
  );
}

(async () => {
  const help = process.argv.find((arg) => arg.indexOf('--help') > -1);

  if (help !== undefined) {
    console.log('Options:');
    console.log('--list-proposals=open|accepted|declined');
    console.log('--accept storage-id id');
    console.log('--decline storage-id id');
    return;
  }

  try {
    const actor = await feedActorLocal();

    const list =
      process.argv.find((arg) => arg.indexOf('--list-proposals') > -1) !== undefined;

    if (list) {
      const type =
        process.argv
          .find((arg) => arg.indexOf('--list-proposals=') > -1)
          ?.replace('--list-proposals=', '') ?? 'open';

      await listProposals({type, actor});

      return;
    }
  } catch (e) {
    console.error(e);
  }
})();
