const siteUrl = (process.env.SITE_URL || 'https://lehuang.me').replace(/\/+$/, '');

export const SITE = {
  title: 'Lehuang',
  description: '记录 Linux、服务器运维与项目实践。',
  author: 'Lehuang',
  url: siteUrl,
  lang: 'zh-CN',
  locale: 'zh_CN',
  github: 'https://github.com/Lehuang0212',
  email: '',
  postsPerPage: 5,
};

export const NAV = [
  { label: '首页', href: '/' },
  { label: '归档', href: '/archive/' },
  { label: '标签', href: '/tags/' },
  { label: '关于', href: '/about/' },
];
