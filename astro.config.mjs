// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://fluffy-sundae-5217bc.netlify.app/',
	integrations: [mdx(), sitemap()],
});
