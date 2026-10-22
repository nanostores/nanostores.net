// Downloads the latest release of every repository from
// src/config/upstream.json into .upstream/ and records the tags and commits
// in .upstream/revisions.json. The release is the tag of the `version` in
// package.json on the default branch: 1.5.5 or v1.5.5. The site reads
// READMEs, types and images from there and never runs upstream code: no
// install, no scripts, no hooks, no submodules, symlinks checked out as
// plain files.
//
// Without flags only missing repositories are downloaded. --refresh updates
// all of them to the latest release. UPSTREAM_PINS selects exact commits.
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

const url = (repo) => `https://github.com/${repo}.git`

function fetchCommit(dir, repo, target) {
  git(
    dir,
    'fetch',
    '--quiet',
    '--depth=1',
    '--no-tags',
    '--no-recurse-submodules',
    url(repo),
    target,
  )
}

// The tag of the version the branch declares in package.json.
function releaseTag(dir, repo) {
  fetchCommit(dir, repo, 'HEAD')
  const { version } = JSON.parse(git(dir, 'show', 'FETCH_HEAD:package.json'))
  const tags = git(
    dir,
    'ls-remote',
    '--tags',
    url(repo),
    `refs/tags/${version}`,
    `refs/tags/v${version}`,
  )
    .split('\n')
    .map((line) => line.split('\t')[1]?.replace('refs/tags/', ''))
    .filter((tag) => tag && !tag.endsWith('^{}'))
  if (tags.length !== 1) {
    throw new Error(
      `${repo} declares version ${version} in package.json, ` +
        `but has ${tags.length ? 'several tags' : 'no tag'} for it`,
    )
  }
  return tags[0]
}

const head = (dir) =>
  existsSync(new URL('.git', `${dir.href}/`))
    ? git(dir, 'rev-parse', 'HEAD')
    : ''

mkdirSync(root, { recursive: true })
const revisions = {}
for (const { id, repo } of upstream) {
  const dir = new URL(id, root)
  const pin = pins.get(id)
  if (existsSync(dir) && lstatSync(dir).isSymbolicLink()) {
    revisions[id] = { repo, sha: head(dir) || null, local: true }
    console.log(`${id}: local checkout`)
    continue
  }
  const current = existsSync(dir) ? head(dir) : ''
  const tagFile = new URL(`${id}/.git/upstream-tag`, root)
  let tag = existsSync(tagFile) ? readFileSync(tagFile, 'utf8').trim() : ''
  if (!current || refresh || (pin ? pin !== current : !tag)) {
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir)
    git(dir, 'init', '--quiet')
    tag = pin ? '' : releaseTag(dir, repo)
    fetchCommit(dir, repo, pin ?? `refs/tags/${tag}`)
    git(dir, 'checkout', '--quiet', '--detach', 'FETCH_HEAD')
    writeFileSync(tagFile, tag)
  }
  const sha = head(dir)
  revisions[id] = {
    repo,
    tag: tag || null,
    sha,
    ...(pin ? { pinned: true } : {}),
  }
  console.log(`${id}: ${repo}@${pin ? `${sha.slice(0, 7)} (pinned)` : tag}`)
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
