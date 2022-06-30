import {toDate} from '@deckdeckgo/editor';
import {PublishMeta} from '../types/publish.metas';

const siteRSS = ({
  items,
  author,
  bucketUrl
}: {
  items: string;
  author: string;
  bucketUrl: string;
}): string => {
  const lastBuildDate: string = new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?><rss xmlns:dc="http://purl.org/dc/elements/1.1/" version="2.0">
    <channel>
        <title><![CDATA[${author} blog]]></title>
        <description><![CDATA[The latest blog posts of ${author}]]></description>
        <link>${bucketUrl}</link>
        <lastBuildDate>${lastBuildDate}</lastBuildDate>
        
        ${items}
    </channel>
</rss>`;
};

const items = ({metas, bucketUrl}: {metas: PublishMeta[]; bucketUrl: string}): string[] =>
  metas.map(
    ({meta: {title, description, pathname, published_at}}: PublishMeta) => `
  <item>
    <title><![CDATA[${title}]]></title>
    <description><![CDATA[${description ?? title}]]></description>
    <link>${bucketUrl}${pathname}</link>
    <pubDate>${(toDate(published_at) ?? new Date()).toUTCString()}</pubDate>
  </item>
`
  );

export const prepareRSS = ({
  bucketUrl,
  metas,
  author
}: {
  bucketUrl: string;
  metas: PublishMeta[];
  author: string;
}): string => {
  const posts: string[] = items({metas, bucketUrl});

  return siteRSS({bucketUrl, items: posts.join(''), author});
};
