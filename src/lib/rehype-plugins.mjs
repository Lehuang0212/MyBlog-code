import { visit } from 'unist-util-visit';

/**
 * The articles use `# 一、...` for their top-level sections. Shift every heading
 * down one level so the page title stays the only h1.
 */
export function shiftHeadings() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      const match = /^h([1-5])$/.exec(node.tagName);
      if (match) {
        node.tagName = `h${Number(match[1]) + 1}`;
      }
    });
  };
}

/**
 * Wrap wide tables so they can scroll horizontally without breaking the prose.
 */
export function wrapTables() {
  const wrapped = new WeakSet();

  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index == null) return;
      if (wrapped.has(node)) return;
      wrapped.add(node);

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-wrap'] },
        children: [node],
      };
    });
  };
}

/**
 * Remote Markdown images are regular <img> tags in Astro. Add native lazy
 * loading so long articles do not fetch every screenshot up front.
 */
export function lazyImages() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      node.properties = node.properties || {};
      node.properties.loading = 'lazy';
      node.properties.decoding = 'async';
    });
  };
}
