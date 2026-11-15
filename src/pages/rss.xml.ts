import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../consts';
import { getAllPosts } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = await getAllPosts();
  const site = context.site?.href ?? SITE.url;

  return rss({
    title: SITE.title,
    description: SITE.description,
    site,
    items: posts.map((post) => ({
      title: post.title,
      description: post.description,
      link: post.href,
      categories: post.tags,
      ...(post.date ? { pubDate: post.date } : {}),
    })),
    customData: '<language>zh-cn</language>',
  });
}
