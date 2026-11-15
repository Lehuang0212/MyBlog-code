import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const contentDir = resolve(projectRoot, 'src/content/blog');
const contentRepo = 'https://github.com/Lehuang0212/MyBlog-content.git';

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: options.cwd ?? projectRoot,
    stdio: 'inherit',
    timeout: options.timeoutMs ?? 0,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed`);
  }
}

function isGitRepo(directory) {
  return existsSync(resolve(directory, '.git'));
}

async function main() {
  await mkdir(dirname(contentDir), { recursive: true });

  if (!existsSync(contentDir)) {
    console.log(`[content] Cloning ${contentRepo} -> ${contentDir}`);
    runGit(['clone', '--depth=1', '--single-branch', '--branch', 'main', contentRepo, contentDir], {
      timeoutMs: 180_000,
    });
    return;
  }

  if (!isGitRepo(contentDir)) {
    throw new Error(
      `Content directory exists but is not a git repository: ${contentDir}. ` +
        'Remove it and run the build again.',
    );
  }

  try {
    console.log('[content] Updating MyBlog-content');
    runGit(['fetch', '--depth=1', 'origin', 'main'], {
      cwd: contentDir,
      timeoutMs: 60_000,
    });
    runGit(['reset', '--hard', 'FETCH_HEAD'], {
      cwd: contentDir,
      timeoutMs: 30_000,
    });
  } catch (error) {
    if (process.env.CI) {
      throw error;
    }
    console.warn(`[content] Update failed, using the existing checkout: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(`[content] ${error.message}`);
  process.exit(1);
});
