import {Paragraph, ParagraphData} from '@deckdeckgo/editor';
import {getData} from '../../api/data.api';

export const getParagraph = (docId: string, paragraphId: string): Promise<Paragraph | undefined> =>
  getData<Paragraph, ParagraphData>({
    key: `/docs/${docId}/paragraphs/${paragraphId}`
  });
