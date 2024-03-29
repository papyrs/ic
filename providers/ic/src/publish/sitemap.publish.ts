import {PublishMeta} from '../types/publish.types';

const siteMapTemplate = (urls: string): string => `<?xml version="1.0" encoding="UTF-8" ?>
  <urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
    xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
  >
    ${urls}
</urlset>`;

const sitemapUrl = (url: string): string => `<url>
  <loc>${url}</loc>
  <changefreq>daily</changefreq>
  <priority>0.7</priority>
</url>`;

export const prepareSitemap = ({
  bucketUrl,
  metas
}: {
  bucketUrl: string;
  metas: PublishMeta[];
}): string => {
  const rootUrl: string = sitemapUrl(bucketUrl);
  const postsUrls: string[] = metas.map(({meta: {pathname}}: PublishMeta) =>
    sitemapUrl(`${bucketUrl}${pathname}`)
  );

  return siteMapTemplate([rootUrl, ...postsUrls].join(''));
};
