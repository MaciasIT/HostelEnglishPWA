#!/usr/bin/env node
/**
 * Generador de Códigos de Invitación VIP / Licencias Pro Offline
 * ==============================================================
 * Uso:
 *   node scripts/generate_invite.mjs "amigo@hotel.com" [dias=365]
 *   node scripts/generate_invite.mjs "Pedro Recepcion" 180
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_PATH = path.join(__dirname, '.license_private_key.pem');

if (!fs.existsSync(KEY_PATH)) {
  console.error('Error: No se encontró la clave privada en:', KEY_PATH);
  process.exit(1);
}

const args = process.argv.slice(2);
const recipient = args[0] || 'invitado@hostelenglish.app';
const days = parseInt(args[1] || '365', 10);

const privateKeyPem = fs.readFileSync(KEY_PATH, 'utf-8');
const privateKey = crypto.createPrivateKey(privateKeyPem);

const now = Date.now();
const expiresAt = now + (days * 24 * 60 * 60 * 1000);

const payload = {
  email: recipient,
  tier: 'pro',
  type: days >= 3650 ? 'lifetime' : 'annual',
  issuedAt: now,
  expiresAt: expiresAt
};

const payloadBytes = Buffer.from(JSON.stringify(payload), 'utf-8');
const signature = crypto.sign(null, payloadBytes, privateKey);

function base64UrlEncode(buf) {
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const token = `${base64UrlEncode(payloadBytes)}.${base64UrlEncode(signature)}`;

// Fecha legible
const expDateStr = new Date(expiresAt).toLocaleDateString('es-ES', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

console.log('\n' + '='.repeat(60));
console.log('   HOSTELENGLISH PWA 2026 — LICENCIA VIP / PRO');
console.log('='.repeat(60));
console.log(`👤 Destinatario : ${recipient}`);
console.log(`⏳ Validez      : ${days} días (hasta el ${expDateStr})`);
console.log(`🔑 Token Pro    :`);
console.log('\n' + token + '\n');
console.log('-'.repeat(60));
console.log('📋 MENSAJE LISTO PARA COPIAR Y PEGAR EN WHATSAPP / EMAIL:');
console.log('-'.repeat(60));
console.log(`¡Hola! Te paso el acceso a la versión Pro completa de HostelInglés PWA:

1. Abre la app en tu móvil u ordenador:
   https://maciasit.github.io/HostelEnglishPWA/

2. Ve a Menú / Ajustes (o pulsa en "Activar Pro").
3. Pega este código de activación:

${token}

Tendrás desbloqueados todos los departamentos, roleplay ilimitado, pronunciación por IA y el examen de certificación oficial hasta ${expDateStr}. ¡Cuéntame qué te parece!
`);
console.log('='.repeat(60) + '\n');
