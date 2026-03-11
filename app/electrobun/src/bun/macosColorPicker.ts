import { existsSync } from 'node:fs'
import { mkdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'

import type { ColorPickResult } from '../shared/contracts'

const HELPER_NAME = 'peka-electrobun-color-picker'
const HELPER_BINARY = join(tmpdir(), HELPER_NAME)
const SOURCE_PATH = join(import.meta.dir, '..', 'native', 'macos', 'color-picker.swift')

const ensureHelperBinary = async (): Promise<string> => {
  const sourceStats = await stat(SOURCE_PATH)

  if (existsSync(HELPER_BINARY)) {
    const binaryStats = await stat(HELPER_BINARY)
    if (binaryStats.mtimeMs >= sourceStats.mtimeMs) {
      return HELPER_BINARY
    }
  }

  await mkdir(dirname(HELPER_BINARY), { recursive: true })

  const build = Bun.spawn(['swiftc', SOURCE_PATH, '-o', HELPER_BINARY], {
    stdout: 'pipe',
    stderr: 'pipe'
  })

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(build.stdout).text(),
    new Response(build.stderr).text(),
    build.exited
  ])

  if (exitCode !== 0) {
    throw new Error(`Failed to compile macOS color picker helper.\n${stdout}\n${stderr}`.trim())
  }

  return HELPER_BINARY
}

export const pickColorWithMacOSHelper = async (): Promise<ColorPickResult | null> => {
  const binaryPath = await ensureHelperBinary()

  const run = Bun.spawn([binaryPath], {
    stdout: 'pipe',
    stderr: 'pipe'
  })

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(run.stdout).text(),
    new Response(run.stderr).text(),
    run.exited
  ])

  if (exitCode !== 0) {
    throw new Error(`macOS color picker helper failed.\n${stdout}\n${stderr}`.trim())
  }

  const trimmed = stdout.trim()
  if (!trimmed || trimmed === 'null') {
    return null
  }

  const parsed = JSON.parse(trimmed) as ColorPickResult
  if (!parsed?.hex) {
    throw new Error(`Unexpected helper output: ${trimmed}`)
  }

  return parsed
}
