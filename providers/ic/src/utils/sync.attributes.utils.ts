import {Deck, Paragraph, Slide, StorageFile} from '@deckdeckgo/editor';
import {SyncStorage} from '../types/sync.storage';

export const updateDeckBackground = ({
  deck,
  storageFile,
  imgSrc
}: {
  deck: Deck;
  storageFile: StorageFile | undefined;
  imgSrc: string | undefined;
}): Deck => {
  if (!storageFile || !imgSrc) {
    return {...deck};
  }

  return {
    id: deck.id,
    data: {
      ...deck.data,
      updated_at: new Date(),
      background: updateContentImg({
        data: deck.data.background,
        src: imgSrc,
        storageFile
      })
    }
  };
};

export const updateSlideImages = ({
  slide,
  images
}: {
  slide: Slide;
  images: SyncStorage[] | undefined;
}): Slide => {
  if (!images) {
    return {...slide};
  }

  const validImages: {src: string; storageFile: StorageFile}[] = images.filter(
    ({src, storageFile}: SyncStorage) => src !== undefined && storageFile !== undefined
  );

  let {content} = slide.data;

  validImages.forEach(({src, storageFile}: SyncStorage) => {
    content = updateContentImg({
      data: content,
      storageFile,
      src
    });
  });

  return {
    id: slide.id,
    data: {
      ...slide.data,
      updated_at: new Date(),
      content
    }
  };
};

export const updateParagraphAssets = ({
  paragraph,
  files
}: {
  paragraph: Paragraph;
  files: SyncStorage[] | undefined;
}): Paragraph => {
  if (!files) {
    return {...paragraph};
  }

  const validFiles: {src: string; storageFile: StorageFile}[] = files.filter(
    ({src, storageFile}: SyncStorage) => src !== undefined && storageFile !== undefined
  );

  let {children, nodeName, attributes} = paragraph.data;

  // The paragraph itself might be an image
  if (nodeName === 'deckgo-lazy-img' && attributes) {
    validFiles.forEach(({src, storageFile}: SyncStorage) => {
      attributes = updateAttributeImg({
        attributes,
        storageFile,
        src
      });
    });
  }

  children = children?.map((content: string) => {
    validFiles.forEach(({src, storageFile}: SyncStorage) => {
      content = updateContentImg({
        data: content,
        storageFile,
        src
      });
    });

    return content;
  });

  return {
    id: paragraph.id,
    data: {
      ...paragraph.data,
      updated_at: new Date(),
      children,
      attributes
    }
  };
};

export const updateSlideChart = ({
  slide,
  chart
}: {
  slide: Slide;
  chart: SyncStorage | undefined;
}): Slide => {
  if (!chart) {
    return {...slide};
  }

  const {src, storageFile} = chart;

  if (!src || !storageFile) {
    return {...slide};
  }

  const {attributes} = slide.data;

  if (!attributes) {
    return {...slide};
  }

  const {downloadUrl} = storageFile;

  return {
    id: slide.id,
    data: {
      ...slide.data,
      updated_at: new Date(),
      attributes: {
        ...attributes,
        src: downloadUrl
      }
    }
  };
};

const updateContentImg = ({
  data,
  storageFile,
  src
}: {
  data: string;
  storageFile: StorageFile;
  src: string;
}): string => {
  const {downloadUrl, name} = storageFile;

  let updateData: string = data.replaceAll(`img-src="${src}"`, `img-src="${downloadUrl}"`);
  updateData = updateData.replaceAll(`img-alt="${src}"`, `img-alt="${name}"`);
  updateData = updateData.replaceAll(`data-src="${src}"`, `data-src="${downloadUrl}"`);

  return updateData;
};

const updateAttributeImg = ({
  attributes,
  storageFile,
  src
}: {
  attributes: Record<string, string | number | boolean | undefined>;
  storageFile: StorageFile;
  src: string;
}): Record<string, string | number | boolean | undefined> => {
  const {downloadUrl} = storageFile;

  return Object.keys(attributes).reduce(
    (acc: Record<string, string | number | boolean | undefined>, key: string) => {
      acc[key] = attributes[key] === src ? downloadUrl : attributes[key];
      return acc;
    },
    {}
  );
};
