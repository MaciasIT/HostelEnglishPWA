import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CSP Security Policy', () => {
    it('should have the correct CSP for Google TTS in index.html', () => {
        const indexPath = path.resolve(__dirname, '../index.html');
        const content = fs.readFileSync(indexPath, 'utf-8');
        
        // Expected CSP string (normalized)
        const expectedCSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.googleapis.com https://*.google.com; font-src 'self'; form-action 'self'; base-uri 'self'; object-src 'none';";
        
        const cspMatch = content.match(/<meta http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
        
        expect(cspMatch).not.toBeNull();
        if (cspMatch) {
            const actualCSP = cspMatch[1].replace(/\s+/g, ' ').trim();
            expect(actualCSP).toBe(expectedCSP.replace(/\s+/g, ' ').trim());
        }
    });
});
