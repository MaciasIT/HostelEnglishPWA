import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Settings Page Quality', () => {
    it('should NOT use dangerouslySetInnerHTML in Settings.tsx', () => {
        const settingsPath = path.resolve(__dirname, '../src/pages/Settings.tsx');
        const content = fs.readFileSync(settingsPath, 'utf-8');
        
        expect(content).not.toContain('dangerouslySetInnerHTML');
    });

    it('should have custom-scrollbar class defined in styles/index.css', () => {
        const cssPath = path.resolve(__dirname, '../src/styles/index.css');
        const content = fs.readFileSync(cssPath, 'utf-8');
        
        expect(content).toContain('.custom-scrollbar');
    });
});
