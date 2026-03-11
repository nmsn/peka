import { pickColorWithMacOSHelper } from './macosColorPicker'

const main = async (): Promise<void> => {
  if (process.platform !== 'darwin') {
    console.log(JSON.stringify({ skipped: true, reason: 'macOS only' }))
    return
  }

  const startedAt = Date.now()
  const result = await pickColorWithMacOSHelper()
  const elapsedMs = Date.now() - startedAt

  console.log(
    JSON.stringify({
      ok: Boolean(result),
      elapsedMs,
      result
    })
  )
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(JSON.stringify({ ok: false, error: message }))
  process.exit(1)
})
