/* eslint-env node */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Config } from 'tailwindcss';
import { generateThemeColors } from './utils/generateThemeColors';
import Typography from '@tailwindcss/typography';

const clientCode = process.env.NUXT_PUBLIC_CLIENT_CODE || 'mariee';
const themePath = resolve(`./configs/${clientCode}/theme.json`);

let theme = {
  colors: {
    grey: {},
    primary: {},
    success: {},
    danger: {},
    warning: {},
    purple: {},
    invitation: '',
    textEditorPrimaryColor: '',
  },
  fontFamily: {
    sans: '',
    serif: '',
    script: '',
    fresca: '',
    alex: '',
  },
};

try {
  if (existsSync(themePath)) {
    theme = JSON.parse(readFileSync(themePath, 'utf-8'));
  } else {
    console.warn(`⚠️ theme.json not found for client "${clientCode}"`);
  }
} catch (e) {
  console.error(`❌ Error loading theme.json: ${e}`);
}

export default <Partial<Config>>{
  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '976px',
      xl: '1440px',
    },
    extend: {
      colors: {
        grey: generateThemeColors(theme?.colors?.grey || {}),
        primary: generateThemeColors(theme?.colors?.primary || {}),
        success: generateThemeColors(theme?.colors?.success || {}),
        danger: generateThemeColors(theme?.colors?.danger || {}),
        warning: generateThemeColors(theme?.colors?.warning || {}),
        purple: generateThemeColors(theme?.colors?.purple || {}),
        invitation: theme?.colors?.invitation,
      },
      fontFamily: {
        sans: theme.fontFamily?.sans,
        serif: theme.fontFamily?.serif,
        script: theme.fontFamily?.script,
        fresca: theme.fontFamily?.fresca,
        alex: theme.fontFamily?.alex,
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.2' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-in',
        blink: 'blink 1.5s ease-in-out infinite',
      },
      typography: {
        DEFAULT: {
          css: {
            'ul > li::marker': {
              color: theme?.colors?.textEditorPrimaryColor,
            },
            'ol > li::marker': {
              color: theme?.colors?.textEditorPrimaryColor,
            },
            blockquote: {
              color: '#F4F9E9',
              borderLeftColor: theme?.colors?.textEditorPrimaryColor,
            },
            'blockquote p::before, blockquote p::after': {
              color: theme?.colors?.textEditorPrimaryColor,
            },
          },
        },
      },
    },
  },

  content: [
    'components/**/*.{vue,js,ts}',
    'layouts/**/*.vue',
    'pages/**/*.vue',
    'composables/**/*.{js,ts}',
    'plugins/**/*.{js,ts}',
    'App.{js,ts,vue}',
    'app.{js,ts,vue}',
    'Error.{js,ts,vue}',
    'error.{js,ts,vue}',
    'content/**/*.md',
  ],

  plugins: [Typography],
};
