// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { IOS_VIEWPORT, isIos, preventIosFieldZoom } from './iosZoom';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';

describe('isIos', () => {
  it('finds iPhones, and iPads that report themselves as Macs', () => {
    expect(isIos(IPHONE, 'iPhone', 5)).toBe(true);
    expect(isIos(MAC, 'MacIntel', 5)).toBe(true);
  });

  it('leaves Android and real Macs alone', () => {
    expect(isIos(ANDROID, 'Linux armv8l', 5)).toBe(false);
    expect(isIos(MAC, 'MacIntel', 0)).toBe(false);
  });
});

describe('preventIosFieldZoom', () => {
  const page = () => {
    document.head.innerHTML = '<meta name="viewport" content="width=device-width, initial-scale=1">';
    return document.querySelector('meta[name="viewport"]')!;
  };

  it('stops the zoom into fields on iOS only', () => {
    const meta = page();
    preventIosFieldZoom(document, { userAgent: IPHONE, platform: 'iPhone', maxTouchPoints: 5 } as Navigator);
    expect(meta.getAttribute('content')).toBe(IOS_VIEWPORT);

    const other = page();
    preventIosFieldZoom(document, { userAgent: ANDROID, platform: 'Linux armv8l', maxTouchPoints: 5 } as Navigator);
    expect(other.getAttribute('content')).toBe('width=device-width, initial-scale=1');
  });
});
