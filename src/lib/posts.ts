import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogEntry = CollectionEntry<'blog'>;

export type Post = {
  entry: BlogEntry;
  id: string;
  slug: string;
  href: string;
  title: string;
  date: Date | null;
  tags: string[];
  description: string;
  readingTime: number;
  category: string;
  categoryLabel: string;
};

export type TagSummary = {
  name: string;
  slug: string;
  count: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  linux: 'Linux',
  project: 'Project',
  uncategorized: '未分类',
};

function decodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function normalizeSlug(value: string) {
  return decodeSlug(value).replace(/^\/+|\/+$/g, '').replace(/\\/g, '/');
}

export function encodePath(value: string) {
  return value
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function getPostHref(slug: string) {
  return `/articles/${encodePath(slug)}/`;
}

export function getTagSlug(tag: string) {
  return tag.trim().toLowerCase().replace(/\s+/g, '-');
}

export function getTagHref(tagSlug: string) {
  return `/tags/${encodeURIComponent(tagSlug)}/`;
}

export function getCategoryHref(category: string) {
  return `/categories/${encodeURIComponent(category)}/`;
}

export function getCategoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}

export function titleFromId(id: string) {
  const segment = id.split('/').pop() ?? id;
  return decodeSlug(segment).replace(/[-_]+/g, ' ').trim() || '未命名文章';
}

function titleFromEntry(entry: BlogEntry) {
  const frontmatterTitle = entry.data.title?.trim();
  if (frontmatterTitle) return frontmatterTitle;

  const source = entry.filePath ?? entry.id;
  const filename = source.split(/[\\/]/).pop() ?? entry.id;
  return filename.replace(/\.mdx?$/i, '').trim() || titleFromId(entry.id);
}

/**
 * Frontmatter dates in this content repo predate timezone-aware metadata. Treat
 * a date without a zone as Asia/Shanghai instead of relying on the build
 * machine's local timezone, which would shift evening posts to the next day.
 */
function parseDate(value: unknown): Date | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;

    // Astro's YAML frontmatter parser turns unquoted timestamps without a zone
    // into a Date whose UTC fields are the original wall clock. Re-interpret
    // those fields as Asia/Shanghai so evening posts do not move to the next
    // day. Quoted dates with an explicit offset arrive as strings instead.
    const wallClock = Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
      value.getUTCHours(),
      value.getUTCMinutes(),
      value.getUTCSeconds(),
    );
    return new Date(wallClock - 8 * 60 * 60 * 1000);
  }

  if (typeof value !== 'string') return null;

  const raw = value.trim();
  if (!raw) return null;

  const hasTime = /\d{1,2}:\d{2}/.test(raw);
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  let iso = raw.replace(' ', 'T');

  if (!hasTime) iso = `${iso}T00:00:00`;
  if (!hasZone) iso = `${iso}+08:00`;

  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function stripMarkdown(body: string) {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*\|.*$/gm, ' ')
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, ' ')
    .replace(/^#{1,6}\s+/gm, ' ')
    .replace(/^\s*\d+[.)]\s*/gm, ' ')
    .replace(/^>\s?/gm, ' ')
    .replace(/[*_~]/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/\s+([，。；：！？、,.!?;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function descriptionFromBody(body: string) {
  const beforeMarker = body.split(/<!--\s*more\s*-->/i)[0] ?? body;
  const candidate = stripMarkdown(beforeMarker);
  const source = candidate.length >= 40 ? beforeMarker : body;
  const text = stripMarkdown(source);
  const chars = Array.from(text);
  if (chars.length <= 140) return text;
  return `${chars.slice(0, 140).join('').trim()}…`;
}

function estimateReadingTime(body: string) {
  const cjk = (body.match(/[\u3400-\u9fff]/g) ?? []).length;
  const latin = (body.replace(/[\u3400-\u9fff]/g, ' ').match(/[A-Za-z0-9_]+/g) ?? []).length;
  return Math.max(1, Math.round(cjk / 350 + latin / 220));
}

export function formatDate(date: Date | null) {
  if (!date) return '日期待补';
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeZone: 'Asia/Shanghai',
  }).format(date);
}

export function getYear(date: Date | null) {
  if (!date) return '未标注年份';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    timeZone: 'Asia/Shanghai',
  }).format(date);
}

export async function getAllPosts() {
  const entries = await getCollection('blog', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });

  const posts: Post[] = entries.map((entry) => {
    const id = entry.id.replace(/\\/g, '/').replace(/^\/+/, '');
    const slug = normalizeSlug(entry.data.slug?.trim() || id);
    const title = titleFromEntry(entry);
    const date = parseDate(entry.data.date);
    const tags = [...new Set((entry.data.tags ?? []).map((tag) => tag.trim()).filter(Boolean))];
    const body = entry.body ?? '';
    const description = entry.data.description?.trim() || descriptionFromBody(body);
    const category = id.includes('/') ? id.split('/')[0] : 'uncategorized';

    return {
      entry,
      id,
      slug,
      href: getPostHref(slug),
      title,
      date,
      tags,
      description,
      readingTime: estimateReadingTime(body),
      category,
      categoryLabel: getCategoryLabel(category),
    };
  });

  posts.sort((a, b) => {
    const aTime = a.date?.getTime() ?? -Infinity;
    const bTime = b.date?.getTime() ?? -Infinity;
    if (aTime !== bTime) return bTime - aTime;
    return a.title.localeCompare(b.title, 'zh-CN');
  });

  return posts;
}

export function findPostBySlug(posts: Post[], slug: string) {
  const normalized = normalizeSlug(slug);
  return posts.find((post) => post.slug === normalized || post.id === normalized);
}

export function getAdjacentPosts(posts: Post[], slug: string) {
  const index = posts.findIndex((post) => post.slug === slug || post.id === slug);
  if (index === -1) return { newer: undefined, older: undefined };
  return {
    newer: index > 0 ? posts[index - 1] : undefined,
    older: index < posts.length - 1 ? posts[index + 1] : undefined,
  };
}

export function getAllTags(posts: Post[]) {
  const map = new Map<string, TagSummary>();

  for (const post of posts) {
    for (const tag of post.tags) {
      const slug = getTagSlug(tag);
      const existing = map.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(slug, { name: tag, slug, count: 1 });
      }
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

export function getPostsByTag(posts: Post[], tagSlug: string) {
  return posts.filter((post) => post.tags.some((tag) => getTagSlug(tag) === tagSlug));
}

export function getAllCategories(posts: Post[]) {
  const map = new Map<string, { name: string; slug: string; count: number }>();

  for (const post of posts) {
    const existing = map.get(post.category);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(post.category, {
        name: post.categoryLabel,
        slug: post.category,
        count: 1,
      });
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

export function getPostsByCategory(posts: Post[], category: string) {
  return posts.filter((post) => post.category === category);
}
