import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import { lazyImages, shiftHeadings, wrapTables } from './src/lib/rehype-plugins.mjs';

const site = process.env.SITE_URL || 'https://lehuang.me';

export default defineConfig({
  site,
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
    expressiveCode({
      themes: ['github-light', 'github-dark'],
      customizeTheme: (theme) => {
        theme.name = theme.name.includes('dark') ? 'dark' : 'light';
      },
      useDarkModeMediaQuery: false,
      styleOverrides: {
        borderRadius: '10px',
        codeFontFamily: 'var(--font-mono)',
      },
    }),
  ],
  markdown: {
    processor: unified({
      rehypePlugins: [shiftHeadings, wrapTables, lazyImages],
    }),
  },
});
