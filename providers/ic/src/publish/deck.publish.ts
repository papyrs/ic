import {Deck, DeckData, DeckPublishData, deckPublishData, PublishData} from '@deckdeckgo/editor';
import {get, update} from 'idb-keyval';
import {setData} from '../services/data.services';
import {EnvStore} from '../stores/env.store';
import {PublishCanisterIds} from '../types/publish.types';
import {
  initIndexHTML,
  initUpload,
  StorageUpload,
  updateMetaData,
  uploadPublishFileIC
} from './common.publish';
import {uploadSocialImage} from './social.publish';

export const publishDeck = async ({
  deck: deckSource,
  canisterIds
}: {
  deck: Deck;
  canisterIds: PublishCanisterIds;
}): Promise<{
  deck: Deck;
  storageUpload: StorageUpload;
  publishData: PublishData;
}> => {
  const {id, data} = deckSource;
  const {meta} = data;

  // 1. Init and fill HTML
  const indexHTML: {html: string; publishData: DeckPublishData} = await initDeckIndexHTML({
    deck: deckSource,
    canisterIds
  });
  const {storageUpload, publishData} = await initUpload({
    indexHTML,
    folder: 'p',
    meta
  });

  // 2. Update deck published meta
  const deckData: DeckData = updateMetaData<DeckData>({
    data,
    meta: data.meta,
    name: data.name,
    storageUpload
  });

  // 2.a We save the new meta data in IndexedDB and preserve current timestamps
  await update<Deck>(`/decks/${id}`, (currentData: Deck) => ({
    ...currentData,
    data: deckData
  }));

  // 2.b We read the current record for the timestamp
  const record: Deck = await get(`/decks/${id}`);

  // 3. Update deck meta information
  const deck: Deck = await setData<DeckData>({
    key: `/decks/${id}`,
    record,
    updateTimestamps: true
  });

  // 4. Upload
  await uploadPublishFileIC(storageUpload);

  // 5. Upload
  await uploadSocialImage({storageUpload, publishData});

  return {
    storageUpload,
    publishData,
    deck
  };
};

const initDeckIndexHTML = async ({
  deck,
  canisterIds
}: {
  deck: Deck;
  canisterIds: PublishCanisterIds;
}): Promise<{html: string; publishData: DeckPublishData}> => {
  const publishData: DeckPublishData = await deckPublishData({
    deck,
    fallbackAuthor: EnvStore.getInstance().get().author
  });

  const {slides} = publishData;

  const updateTemplateContent = ({
    attr,
    template
  }: {
    attr: string | undefined;
    template: string;
  }): string =>
    template.replace(
      '<!-- DECKDECKGO_DECK -->',
      `<deckgo-deck id="slider" embedded="true" ${attr || ''}>${slides.join('')}</deckgo-deck>`
    );

  const {html}: {html: string} = await initIndexHTML({
    publishData,
    ids: {
      ...canisterIds,
      data_id: deck.id
    },
    updateTemplateContent,
    sourceFolder: 'p'
  });

  return {
    html,
    publishData
  };
};

export const emitDeckPublished = (deck: Deck) => {
  const {id, data} = deck;

  const deployedDeck: Deck = {
    id,
    data: {
      ...data,
      deploy: {
        api: {
          status: 'successful',
          updated_at: new Date()
        }
      }
    }
  };

  const $event: CustomEvent<Deck> = new CustomEvent('deckPublished', {
    detail: deployedDeck
  });
  document.dispatchEvent($event);
};
