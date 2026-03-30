import { describe, it, expect } from 'vitest';
import { getT, detectServerLang, detectClientLang } from './index';

describe('getT', () => {
  it('returns French translations for "fr"', () => {
    const fr = getT('fr');
    const en = getT('en');
    // The objects should be distinct (different translation sets)
    expect(fr).not.toBe(en);
  });

  it('returns an object for "en"', () => {
    const t = getT('en');
    expect(t).toBeDefined();
    expect(typeof t).toBe('object');
  });

  it('falls back to English for an unknown locale', () => {
    expect(getT('de')).toBe(getT('en'));
  });

  it('falls back to English for an empty string', () => {
    expect(getT('')).toBe(getT('en'));
  });
});

describe('detectServerLang', () => {
  it('returns "fr" for a full French Accept-Language header', () => {
    expect(detectServerLang('fr-FR,fr;q=0.9,en;q=0.8')).toBe('fr');
  });

  it('returns "fr" for a bare "fr" value', () => {
    expect(detectServerLang('fr')).toBe('fr');
  });

  it('returns "en" for an English Accept-Language header', () => {
    expect(detectServerLang('en-US,en;q=0.9')).toBe('en');
  });

  it('returns "en" for null', () => {
    expect(detectServerLang(null)).toBe('en');
  });

  it('returns "en" for undefined', () => {
    expect(detectServerLang(undefined)).toBe('en');
  });

  it('returns "en" for an empty string', () => {
    expect(detectServerLang('')).toBe('en');
  });
});

describe('detectClientLang', () => {
  it('returns "en" when navigator is undefined (node / SSR environment)', () => {
    // vitest runs in node — navigator is not defined by default
    expect(detectClientLang()).toBe('en');
  });

  it('returns "fr" when navigator.language starts with "fr"', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'fr-FR' },
      configurable: true,
      writable: true,
    });
    expect(detectClientLang()).toBe('fr');
    Object.defineProperty(globalThis, 'navigator', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it('returns "en" when navigator.language is "en-US"', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'en-US' },
      configurable: true,
      writable: true,
    });
    expect(detectClientLang()).toBe('en');
    Object.defineProperty(globalThis, 'navigator', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });
});
