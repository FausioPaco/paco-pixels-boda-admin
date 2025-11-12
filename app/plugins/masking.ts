interface MaskedElement extends HTMLElement {
  _numberMaskInputHandler?: EventListener;
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('number-mask', {
    beforeMount(el: HTMLElement) {
      const inputHandler = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const value = target.value;

        // Permitir apenas dígitos, vírgula e ponto
        const filtered = value.replace(/[^0-9.,]/g, '');
        if (filtered !== value) {
          target.value = filtered;
          target.dispatchEvent(new Event('input'));
        }
      };

      el.addEventListener('input', inputHandler);
      (el as MaskedElement)._numberMaskInputHandler = inputHandler;
    },
    unmounted(el: HTMLElement) {
      const handler = (el as MaskedElement)._numberMaskInputHandler;
      if (handler) {
        el.removeEventListener('input', handler);
      }
    },
  });
});
