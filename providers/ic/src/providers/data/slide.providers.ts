import {Slide, SlideData} from '@deckdeckgo/editor';
import {getData} from '../../api/data.api';

export const getSlide = (deckId: string, slideId: string): Promise<Slide | undefined> =>
  getData<SlideData>({key: `/decks/${deckId}/slides/${slideId}`});
