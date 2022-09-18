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

const sha256ToBase64String = (sha256: Iterable<number>): string =>
  btoa([...sha256].map((c) => String.fromCharCode(c)).join(''));

export const uploadResources = async ({meta}: {meta: Meta | undefined}) => {
  // 1. Get actor
  const {actor}: BucketActor<StorageBucketActor> = await getStorageActor();

  // 2. Get already uploaded assets and their respective sha256 value (if defined)
  const assetKeys: AssetKey[] = await actor.list(toNullable<string>('resources'));

  // 3. Get list of resources - i.e. the kit
  const kit: Kit[] = await getKit();

  const promises: Promise<void>[] = kit.map((kit: Kit) => addKitIC({kit, actor, meta, assetKeys}));
  await Promise.all(promises);
};

const updatedResource = ({
  src,
  sha256,
  assetKeys
}: {
  src: string;
  sha256: string | undefined;
  assetKeys: AssetKey[];
}): boolean => {
  const kitFullPath: string = src.replace(getKitPath(), '');

  const key: AssetKey | undefined = assetKeys.find(({fullPath}) => kitFullPath === fullPath);

  const assetSha256: string = sha256ToBase64String(new Uint8Array(fromNullable(key.sha256) ?? []));

  return key === undefined || sha256 === undefined || sha256 !== assetSha256;
};

// Source: https://stackoverflow.com/a/70891826/5404186
const digestMessage = async (message): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return crypto.subtle.digest('SHA-256', data);
};

const addDynamicKitIC = async ({
  kit,
  actor,
  meta,
  assetKeys
}: {
  kit: Kit;
  actor: StorageBucketActor;
  meta: Meta | undefined;
  assetKeys: AssetKey[];
}) => {
  const {src, filename, mimeType, updateContent, headers} = kit;

  const content: string = await downloadKit(src);
  const updatedContent: string = updateContent({content, meta});
  const sha256: string = sha256ToBase64String(new Uint8Array(await digestMessage(updatedContent)));

  if (!updatedResource({src, sha256, assetKeys})) {
    return;
  }

  await uploadKit({
    filename,
    content: updatedContent,
    actor,
    mimeType,
    headers,
    fullPath: src.replace(getKitPath(), '')
  });
};

const addKitIC = async ({
  kit,
  actor,
  meta,
  assetKeys
}: {
  kit: Kit;
  actor: StorageBucketActor;
  meta: Meta | undefined;
  assetKeys: AssetKey[];
}) => {
  const {updateContent} = kit;

  // If updateContent is defined we have to compare the sha256 value of the content that will be updated first
  // e.g. avoiding uploading the manifest at each publish
  if (updateContent !== undefined) {
    await addDynamicKitIC({kit, actor, meta, assetKeys});

    return;
  }

  const {src, filename, mimeType, headers, sha256} = kit;

  if (!updatedResource({src, sha256, assetKeys})) {
    return;
  }

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
    .map((resource: KitResource | string) => toResource(resource))
    .map((resource: Partial<Kit>) => {
      const {pathname}: URL = new URL(resource.src);
      return {
        ...resource,
        filename: pathname.split('/').pop(),
        headers: [['Cache-Control', 'max-age=31536000']]
      } as Kit;
    });
};
