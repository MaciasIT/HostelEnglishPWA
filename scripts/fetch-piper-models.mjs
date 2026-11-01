#!/usr/bin/env node
/**
 * Descarga y verifica las voces Piper euskaldunas para self-hosting.
 *
 * Los modelos se sirven por defecto desde el CDN de Hugging Face y el service
 * worker los cachea en Cache Storage (offline-first), por lo que no es
 * necesario descargarlos para el despliegue estándar. Este script los copia a
 * `public/models/piper/` para quien quiera servirlos desde el propio origen
 * (ajustando después `VITE_PIPER_MODEL_BASE_URL=/HostelEnglishPWA/models/piper`).
 *
 * Uso:
 *   node scripts/fetch-piper-models.mjs
 *
 * Verifica el SHA-256 de cada artefacto contra `public/models/piper/manifest.json`.
 */
import { createHash } from 'node:crypto';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = join(ROOT, 'public', 'models', 'piper', 'manifest.json');
const OUT_DIR = join(ROOT, 'public', 'models', 'piper');

const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
const { baseUrl, voices } = manifest;

async function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

let failed = false;
for (const [voiceId, voice] of Object.entries(voices)) {
  for (const [kind, file] of Object.entries(voice.files)) {
    const url = `${baseUrl}/${file.path}`;
    const outPath = join(OUT_DIR, file.path);
    await mkdir(dirname(outPath), { recursive: true });

    process.stdout.write(`Descargando ${voiceId} ${kind}… `);
    const res = await fetch(url);
    if (!res.ok) {
      process.stdout.write(`ERROR ${res.status}\n`);
      failed = true;
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const actual = await sha256(buf);
    if (actual !== file.sha256) {
      process.stdout.write(`SHA-256 NO COINCIDE (${actual.slice(0, 12)}…)\n`);
      failed = true;
      continue;
    }
    await writeFile(outPath, buf);
    process.stdout.write(`OK (${buf.length} bytes, sha256 verificada)\n`);
  }
}

if (failed) {
  console.error('\nAlgún artefacto no se pudo descargar o verificar.');
  process.exit(1);
}
console.log('\nVoces Piper euskaldunas descargadas y verificadas.');