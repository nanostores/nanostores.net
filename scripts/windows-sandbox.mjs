import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

// Vite switches to realpathSync.native after its Windows path probe. Some
// Windows sandboxes deny that API while allowing the ordinary realpath call.
// Activate the fallback only in that environment; keep native behaviour elsewhere.
if (process.platform === 'win32') {
  const nativeRealpath = fs.realpathSync.native
  let restricted = false
  try {
    nativeRealpath(process.cwd())
  } catch (error) {
    if (error.code === 'EPERM') restricted = true
    else throw error
  }

  if (restricted) {
    fs.realpathSync.native = (path, options) => {
      try {
        return nativeRealpath(path, options)
      } catch (error) {
        if (error.code !== 'EPERM') throw error
        // This still uses normal filesystem permissions and resolves symlinks.
        return fs.realpathSync(path, options)
      }
    }

    // The sandbox redirects the system temp directory for each process.
    // Vitest's coordinator and workers need to read the same transform cache.
    const temp = fileURLToPath(
      new URL('../.astro/runtime-tmp/', import.meta.url),
    )
    fs.mkdirSync(temp, { recursive: true })
    process.env.TEMP = temp
    process.env.TMP = temp

    // Pass the preload to worker processes and Astro's background server too.
    const preload = `--import="${import.meta.url}"`
    if (!process.env.NODE_OPTIONS?.includes(preload)) {
      process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, preload]
        .filter(Boolean)
        .join(' ')
    }
  }
}
