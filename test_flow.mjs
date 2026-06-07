import path from 'path';
import fs from 'fs';

const envPath = './.env';
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index !== -1) {
      const key = trimmed.substring(0, index).trim();
      const value = trimmed.substring(index + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
  model: 'googleai/gemini-2.5-flash',
});

async function main() {
  try {
    console.log("Calling Gemini 2.5 Flash with key:", process.env.GEMINI_API_KEY);
    const response = await ai.generate({
      prompt: "Ahoj, vygeneruj jednu náhodnou matematickou otázku pro 5. třídu v češtině.",
    });
    console.log("Response:", response.text);
  } catch (err) {
    console.error("Error calling Gemini:", err);
  }
}

main();
