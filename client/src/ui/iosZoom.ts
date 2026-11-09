/**
 * Fields are 14px everywhere. iOS Safari zooms the page into any focused field under 16px, and `maximum-scale=1` in
 * the viewport tag stops that; since iOS 10 it does not stop pinch zoom. Android never zooms into fields, but there
 * the same setting would block pinch zoom, so only iOS gets it.
 */
export function isIos(userAgent: string, platform: string, maxTouchPoints: number): boolean {
  // iPadOS reports itself as a Mac, so a Mac with a touch screen is an iPad.
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

export const IOS_VIEWPORT = 'width=device-width, initial-scale=1, maximum-scale=1';

/** Adds `maximum-scale=1` to the viewport tag on iOS. Elsewhere it leaves the tag alone. */
export function preventIosFieldZoom(doc: Document = document, nav: Navigator = navigator): void {
  if (!isIos(nav.userAgent, nav.platform, nav.maxTouchPoints)) {
    return;
  }
  doc.querySelector('meta[name="viewport"]')?.setAttribute('content', IOS_VIEWPORT);
}
