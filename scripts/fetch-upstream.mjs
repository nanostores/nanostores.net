// Downloads the repositories from src/config/upstream.json into .upstream/
// and records their commits in .upstream/revisions.json. The site reads
// READMEs, types and images from there and never runs upstream code: no
// install, no scripts, no hooks, no submodules, symlinks checked out as
// plain files.
//
// Without flags only missing repositories are downloaded. --refresh updates
// all of them to the latest commit. UPSTREAM_PINS selects exact commits.
// A symlink in place of .upstream/<id> points to a local checkout and is
// used as it is.
import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { readFile } from 'node:fs/promises'
import { relativeImagePaths } from '../src/lib/plugin-images.mjs'
import { parsePins, parseUpstream } from '../src/lib/upstream.mjs'

const root = new URL('../.upstream/', import.meta.url)
const images = new URL('../public/vendor/upstream/', import.meta.url)
const refresh = process.argv.includes('--refresh')
const upstream = parseUpstream(
  JSON.parse(
    await readFile(new URL('../src/config/upstream.json', import.meta.url)),
  ),
)
const pins = parsePins(process.env.UPSTREAM_PINS, upstream)

function git(dir, ...args) {
  return execFileSync('git', ['-c', 'core.symlinks=false', ...args], {
    cwd: dir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  }).trim()
}

const head = (dir) =>
  existsSync(new URL('.git', `${dir.href}/`))
    ? git(dir, 'rev-parse', 'HEAD')
    : ''

mkdirSync(root, { recursive: true })
const revisions = {}
for (const { id, repo, ref } of upstream) {
  const dir = new URL(id, root)
  const pin = pins.get(id)
  if (existsSync(dir) && lstatSync(dir).isSymbolicLink()) {
    revisions[id] = { repo, sha: head(dir) || null, local: true }
    console.log(`${id}: local checkout`)
    continue
  }
  const current = existsSync(dir) ? head(dir) : ''
  if (!current || refresh || (pin && pin !== current)) {
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir)
    git(dir, 'init', '--quiet')
    git(
      dir,
      'fetch',
      '--quiet',
      '--depth=1',
      '--no-tags',
      '--no-recurse-submodules',
      `https://github.com/${repo}.git`,
      pin ?? ref ?? 'HEAD',
    )
    git(dir, 'checkout', '--quiet', '--detach', 'FETCH_HEAD')
  }
  const sha = head(dir)
  revisions[id] = { repo, sha, ...(pin ? { pinned: true } : {}) }
  console.log(`${id}: ${repo}@${sha.slice(0, 7)}${pin ? ' (pinned)' : ''}`)
}
writeFileSync(
  new URL('revisions.json', root),
  `${JSON.stringify(revisions, null, 2)}\n`,
)

// Relative images of the READMEs are served from public/vendor/upstream/<id>/.
// A missing image is reported by the build, which knows the page it is on.
rmSync(images, { recursive: true, force: true })
for (const { id } of upstream) {
  const dir = new URL(`${id}/`, root)
  const readme = readFileSync(new URL('README.md', dir), 'utf8')
  for (const image of relativeImagePaths(readme)) {
    if (image.split('/').includes('..')) {
      throw new Error(`${id} README has an image outside the repo: ${image}`)
    }
    const from = new URL(image, dir)
    if (!existsSync(from) || !lstatSync(from).isFile()) continue
    const to = new URL(`${id}/${image}`, images)
    mkdirSync(new URL('.', to), { recursive: true })
    copyFileSync(from, to)
  }
}
