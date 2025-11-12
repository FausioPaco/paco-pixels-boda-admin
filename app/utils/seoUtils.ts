import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const clientCode = useRuntimeConfig().public.clientCode || 'mariee';
const sitePath = resolve(`./configs/${clientCode}/site.json`);
const siteConfig = JSON.parse(readFileSync(sitePath, 'utf-8'));

export const seoContent = {
  title:
    'Mariee Admin - Gestão inteligente de eventos com a elegância da Mariee',
  description:
    'Aceda ao painel exclusivo da Mariee para gerir o seu casamento ou evento com sofisticação. ',
  image: siteConfig.image,
  url: siteConfig.url,
};
