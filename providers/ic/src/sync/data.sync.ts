import {
  Deck,
  DeckData,
  Doc,
  DocData,
  Paragraph,
  ParagraphData,
  Slide,
  SlideData
} from '@deckdeckgo/editor';
import {_SERVICE as DataBucketActor} from '../canisters/data/data.did';
import {setData} from '../services/data.services';
import {LogWindow} from '../types/sync.window';

export const uploadDeckData = async ({
  deck,
  actor,
  log
}: {
  deck: Deck;
  actor: DataBucketActor;
  log: LogWindow;
}) =>
  setData<DeckData>({
    key: `/decks/${deck.id}`,
    idbData: deck,
    actor,
    log
  });

export const uploadSlideData = async ({
  deckId,
  slide,
  actor,
  log
}: {
  deckId: string;
  slide: Slide;
  actor: DataBucketActor;
  log: LogWindow;
}) =>
  setData<SlideData>({
    key: `/decks/${deckId}/slides/${slide.id}`,
    idbData: slide,
    actor,
    log
  });

export const uploadDocData = async ({
  doc,
  actor,
  log
}: {
  doc: Doc;
  actor: DataBucketActor;
  log: LogWindow;
}) =>
  setData<DocData>({
    key: `/docs/${doc.id}`,
    idbData: doc,
    actor,
    log
  });

export const uploadParagraphData = async ({
  docId,
  paragraph,
  actor,
  log
}: {
  docId: string;
  paragraph: Paragraph;
  actor: DataBucketActor;
  log: LogWindow;
}) =>
  setData<ParagraphData>({
    key: `/docs/${docId}/paragraphs/${paragraph.id}`,
    idbData: paragraph,
    actor,
    log
  });
