import {writeFile} from 'node:fs/promises';
import {heroMaskSvg} from '../lib/gaamup-wordmark.js';
// Keep the moving-image mask identical to the drawn vector outline.
await writeFile(new URL('../public/assets/gaamup-hero/gaamup-mask.svg',import.meta.url),heroMaskSvg());
