import {log, Meta} from '@deckdeckgo/editor';
import {getStorageActor, upload} from '../api/storage.api';
import {
  AssetKey,
  HeaderField,
  _SERVICE as StorageBucketActor
} from '../canisters/storage/storage.did';
import {EnvStore} from '../stores/env.store';
import {fromNullable, toNullable} from '../utils/did.utils';
import {BucketActor} from '../utils/manager.utils';
import {getAuthor} from './common.publish';

type KitMimeType = 'text/javascript' | 'text/plain' | 'application/manifest+json' | 'text/css';

interface Kit {
  src: string;
  filename: string;
  mimeType: KitMimeType;
  sha256: string | undefined;
  headers: HeaderField[];
  updateContent?: ({content, meta}: {meta: Meta | undefined; content: string}) => string;
}

const getKitPath = (): string => EnvStore.getInstance().get().kitPath;

export const uploadResources = async ({meta}: {meta: Meta | undefined}) => {
  // 1. Get actor
  const {actor}: BucketActor<StorageBucketActor> = await getStorageActor();

  // 2. Get already uploaded assets
  const assetKeys: {key: AssetKey; sha256: [] | [Array<number>]}[] = await actor.shas(
    toNullable<string>('resources')
  );

  // TODO: decode correctly sha256 to string
  const keys: {name: string, sha256: string}[] = assetKeys.map(({key: {name}, sha256}) => ({
    name,
    sha256: new TextDecoder().decode(new Uint8Array(fromNullable(sha256) ?? []))
  }));

  console.log(keys);

  // 3. Get list of resources - i.e. the kit
  const kit: Kit[] = await getKit();

  // 4. We only upload resources that have not been yet uploaded. In other words: we upload the resources the first time or if hashes are modified.
  const kitNewFiles: Kit[] = kit.filter(({filename}: Kit) => keys.find(({name}) => filename !== name) === undefined);

  if (!kitNewFiles || kitNewFiles.length <= 0) {
    return;
  }

  const promises: Promise<void>[] = kitNewFiles.map((kit: Kit) => addKitIC({kit, actor, meta}));
  await Promise.all(promises);

  // If there was an update, we ensure we also update the sw list
  await addSwKitIC({kitNewFiles, kit, actor, meta});
};

const addKitIC = async ({
  kit,
  actor,
  meta
}: {
  kit: Kit;
  actor: StorageBucketActor;
  meta: Meta | undefined;
}) => {
  const {src, filename, mimeType, updateContent, headers} = kit;

  const content: string = await downloadKit(src);

  const updatedContent: string = updateContent ? updateContent({content, meta}) : content;

  await uploadKit({
    filename,
    content: updatedContent,
    actor,
    mimeType,
    headers,
    fullPath: src.replace(getKitPath(), '')
  });
};

const addSwKitIC = async ({
  kitNewFiles,
  kit,
  actor,
  meta
}: {
  kitNewFiles: Kit[];
  kit: Kit[];
  actor: StorageBucketActor;
  meta: Meta | undefined;
}) => {
  const sw: Kit | undefined = kitNewFiles.find(
    ({filename}: Kit) => filename === 'service-worker.js'
  );

  if (sw !== undefined) {
    return;
  }

  const swKit: Kit | undefined = kit.find(({filename}: Kit) => filename === 'service-worker.js');

  if (!swKit !== undefined) {
    return;
  }

  await addKitIC({kit: swKit, actor, meta});
};

const uploadKit = async ({
  filename,
  fullPath,
  content,
  actor,
  mimeType,
  headers
}: {
  filename: string;
  fullPath: string;
  content: string;
  actor: StorageBucketActor;
  mimeType: KitMimeType;
  headers: HeaderField[];
}): Promise<void> => {
  await upload({
    data: new Blob([content], {type: mimeType}),
    filename,
    folder: 'resources',
    storageActor: actor,
    fullPath,
    headers,
    log
  });
};

const downloadKit = async (src: string): Promise<string> => {
  const htmlTemplate: Response = await fetch(src);
  return htmlTemplate.text();
};

interface KitResource {
  fullPath: string;
  sha256: string;
}

const getKit = async (): Promise<Kit[]> => {
  const kitPath: string = getKitPath();

  const resources: (KitResource | string)[] = await (await fetch(`${kitPath}/build.json`)).json();

  const toResource = (resource: KitResource | string): Partial<Kit> => {
    const src: string =
      typeof resource === 'string' ? `${kitPath}/${resource}` : `${kitPath}/${resource.fullPath}`;
    const sha256: string | undefined = typeof resource === 'string' ? undefined : resource.sha256;

    if (src.includes('.js')) {
      return {
        src,
        mimeType: 'text/javascript',
        sha256
      };
    }

    if (src.includes('.css')) {
      return {
        src,
        mimeType: 'text/css',
        sha256
      };
    }

    if (src.includes('.webmanifest')) {
      return {
        src,
        mimeType: 'application/manifest+json',
        sha256,
        updateContent: ({content, meta}: {meta: Meta | undefined; content: string}) =>
          content.replace('{{DECKDECKGO_AUTHOR}}', meta?.author?.name || getAuthor())
      };
    }

    return {
      src,
      mimeType: 'text/plain',
      sha256
    };
  };

  return resources
    .map((src: string) => toResource(src))
    .map((resource: Partial<Kit>) => {
      const {pathname}: URL = new URL(resource.src);
      return {
        ...resource,
        filename: pathname.split('/').pop(),
        headers: [['Cache-Control', 'max-age=31536000']]
      } as Kit;
    });
};
