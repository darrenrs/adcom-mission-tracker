import { describe, expect, it } from 'vitest';
import { cycleProgress, parseTimeLeft } from './timeLeft';

describe('parseTimeLeft', () => {
  it.each([
    ['24m', 1440],
    ['1h 5m', 3900],
    ['1h5m', 3900],
    ['90s', 90],
    ['2d 1h', 176400],
    ['1:05:00', 3900],
    ['5:30', 330],
    ['10', 600],
    ['1.5', 90],
    ['  24M ', 1440]
  ])('reads %s', (text, seconds) => {
    expect(parseTimeLeft(text)).toEqual({ seconds });
  });

  it('treats an empty field as unknown', () => {
    expect(parseTimeLeft('')).toEqual({ seconds: null });
    expect(parseTimeLeft('   ')).toEqual({ seconds: null });
  });

  it.each(['abc', '5x', 'm5', '1h 5', '-3m', '1h,5m'])('rejects %s', (text) => {
    expect(parseTimeLeft(text)).toHaveProperty('error');
  });
});

describe('cycleProgress', () => {
  it('turns time left into time done', () => {
    expect(cycleProgress('24m', 3600)).toEqual({ progress: 2160, error: null });
    expect(cycleProgress('1h', 3600)).toEqual({ progress: 0, error: null });
  });

  it('is null when blank and an error when the text cannot be used', () => {
    expect(cycleProgress('', 3600)).toEqual({ progress: null, error: null });
    expect(cycleProgress('2h', 3600).error).toMatch(/longer than one whole cycle/);
    expect(cycleProgress('soon', 3600).error).toMatch(/Use a time like/);
  });
});
