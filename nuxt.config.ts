/* eslint-env node */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const isProd = process.env.NODE_ENV === 'production';
const clientCode = process.env.NUXT_PUBLIC_CLIENT_CODE || 'mariee';

const sitePath = resolve(`./configs/${clientCode}/site.json`);
const siteConfig = JSON.parse(readFileSync(sitePath, 'utf-8'));

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  experimental: {
    renderJsonPayloads: true,
    appManifest: false,
  },
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      htmlAttrs: {
        lang: 'pt-MZ',
      },
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: siteConfig.favicon,
        },
        {
          rel: 'shortcut icon',
          type: 'image/x-icon',
          href: siteConfig.favicon,
        },
      ],
    },
    baseURL: '/',
    layoutTransition: {
      mode: 'out-in',
      name: 'page',
    },
    pageTransition: {
      mode: 'out-in',
      name: 'page',
    },
  },
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@nuxt/fonts',
    '@nuxt/scripts',
    'nuxt-svgo',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    'nuxt-seo-utils',
    'nuxt-link-checker',
    'nuxt-qrcode',
  ],
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  css: ['~/assets/css/app.css'],
  ...(isProd
    ? {
        image: {
          domains: ['res.cloudinary.com'],
          providers: {
            cloudinary: {
              baseURL: 'https://res.cloudinary.com/dwdlzepds/image/upload/',
            },
          },
        },
      }
    : {}),

  fonts: {
    defaults: {
      weights: [100, 200, 300, 400, 500, 600, 700, 800],
    },
  },
  svgo: {
    autoImportPath: '@/assets/icons/',
    componentPrefix: 'icon',
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: '',
      apiImageUrl: '',
      clientCode,
    },
  },

  site: {
    name: siteConfig.seo.name,
    url: siteConfig.seo.url,
    exclude: ['/admin/**', '/login', '/admin'],
  },

  sitemap: {
    exclude: ['/login', '/admin/**'],
  },

  robots: {
    disallow: ['/admin/'],
    blockNonSeoBots: true,
  },

  vite: {
    optimizeDeps: {
      exclude: ['vee-validate'],
    },
  },
  routeRules: {
    '/admin/**': { ssr: false },
  },

  build: {
    transpile: ['@vuepic/vue-datepicker', 'vue-toastification'],
  },
});
