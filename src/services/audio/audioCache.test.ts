import { describe, it, expect, beforeEach } from 'vitest';

import { AudioCache, fragmentKey, hashText } from './audioCache';
import type { AudioFragment } from './audioCache';

const enc = new TextEncoder();
const dec = new TextDecoder();

function fragment(text: string, mimeType = 'audio/mp3'): AudioFragment {
  return { buffer: enc.encode(text).buffer, mimeType };
}

describe('AudioCache', () => {
  let cache: AudioCache;

  beforeEach(async () => {
    cache = new AudioCache();
    await cache.clear();
  });

  it('guarda y recupera un fragmento por clave', async () => {
    await cache.put('k1', fragment('audio-bytes'));
    const got = await cache.get('k1');
    expect(got).toBeDefined();
    expect(dec.decode(got!.buffer)).toBe('audio-bytes');
    expect(got!.mimeType).toBe('audio/mp3');
  });

  it('devuelve undefined para claves inexistentes', async () => {
    expect(await cache.get('missing')).toBeUndefined();
  });

  it('detecta presencia con has', async () => {
    expect(await cache.has('k2')).toBe(false);
    await cache.put('k2', fragment('x'));
    expect(await cache.has('k2')).toBe(true);
  });

  it('borra una entrada y limpia la caché completa', async () => {
    await cache.put('k3', fragment('y'));
    await cache.delete('k3');
    expect(await cache.get('k3')).toBeUndefined();

    await cache.put('k4', fragment('z'));
    await cache.clear();
    expect(await cache.get('k4')).toBeUndefined();
  });
});

describe('fragmentKey / hashText', () => {
  it('produce claves deterministas que distinguen idioma y motor', () => {
    expect(fragmentKey('hello', 'en', 'piper')).toBe(fragmentKey('hello', 'en', 'piper'));
    expect(fragmentKey('hello', 'en', 'piper')).not.toBe(fragmentKey('hello', 'eu', 'piper'));
    expect(fragmentKey('hello', 'en', 'piper')).not.toBe(fragmentKey('hello', 'en', 'web-speech'));
  });

  it('hashText es estable y distingue textos distintos', () => {
    expect(hashText('a')).toBe(hashText('a'));
    expect(hashText('a')).not.toBe(hashText('b'));
  });
});