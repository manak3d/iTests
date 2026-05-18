import { config } from 'dotenv';
config();

import '@/ai/flows/digitize-pdf-content-for-assignment.ts';
import '@/ai/flows/generate-questions-from-extracted-text.ts';