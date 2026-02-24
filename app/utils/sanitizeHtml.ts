// utils/sanitizeHtml.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeRichHtml(html: string, imageBaseUrl: string) {
  // 1) sanitização (SSR e client)
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_ATTR: ['href', 'target', 'rel', 'title', 'alt', 'src', 'loading'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|\/)/i,
    FORBID_TAGS: ['style', 'script', 'iframe'],
    FORBID_ATTR: ['on*'],
  });

  // 2) pós-processamento só no client (precisa de document)
  if (typeof document === 'undefined') {
    return clean;
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = clean;

  // normalizar links
  wrapper.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    if (!/^(https?:|mailto:|\/)/i.test(href)) a.removeAttribute('href');
  });

  // normalizar imagens (base URL + lazy)
  const base = (imageBaseUrl ?? '').replace(/\/+$/, '');
  wrapper.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (!/^https?:\/\//i.test(src)) {
      const path = src.replace(/^\/+/, '');
      img.setAttribute('src', `${base}/${path}`);
    }
    if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
    img.removeAttribute('srcset');
    img.classList.add('max-w-full', 'h-auto');
  });

  return wrapper.innerHTML;
}
