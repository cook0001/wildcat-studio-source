/**
 * Opens an external web link using Tauri plugin-opener if in desktop mode,
 * or standard window.open fallback if in browser mode.
 */
export async function openExternalLink(url: string): Promise<void> {
  try {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(url);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
