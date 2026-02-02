import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Data Integrity - Euskera Translations', () => {
    const phrasesPath = path.resolve(__dirname, '../../public/data/hostelenglish_dataset_clean.json');
    const conversationsPath = path.resolve(__dirname, '../../public/data/conversations_extended_v4.json');

    it('all phrases should have a Basque translation', () => {
        const data = JSON.parse(fs.readFileSync(phrasesPath, 'utf8'));
        const missing = data.phrases.filter((p: any) => !p.eu || p.eu.trim() === '');

        if (missing.length > 0) {
            console.log(`Missing Euskera in phrases: ${missing.length}`);
            // Only show first 5 to keep log clean
            console.log('Sample missing:', missing.slice(0, 5).map((p: any) => p.es));
        }

        expect(missing.length).toBe(0);
    });

    it('all conversation messages should have a Basque translation', () => {
        const data = JSON.parse(fs.readFileSync(conversationsPath, 'utf8'));
        let missingCount = 0;
        const missingSamples: string[] = [];

        data.conversations.forEach((conv: any) => {
            conv.dialogue.forEach((message: any) => {
                if (!message.eu || message.eu.trim() === '') {
                    missingCount++;
                    if (missingSamples.length < 5) missingSamples.push(message.es);
                }
            });
            if (!conv.title_eu) {
                missingCount++;
                if (missingSamples.length < 5) missingSamples.push(`Title: ${conv.title}`);
            }
            if (!conv.scenario_eu) {
                missingCount++;
                if (missingSamples.length < 5) missingSamples.push(`Scenario: ${conv.scenario}`);
            }
        });

        if (missingCount > 0) {
            console.log(`Missing Euskera in conversations: ${missingCount}`);
            console.log('Sample missing:', missingSamples);
        }

        expect(missingCount).toBe(0);
    });
});
