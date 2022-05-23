import {Meta, toDate} from '@deckdeckgo/editor';

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

const items = ({metas, bucketUrl}: {metas: Meta[]; bucketUrl: string}): string[] =>
  metas.map(
    ({title, description, pathname, published_at}: Meta) => `
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
  metas: Meta[];
  author: string;
}): string => {
  const posts: string[] = items({metas, bucketUrl});

  return siteRSS({bucketUrl, items: posts.join(''), author});
};
