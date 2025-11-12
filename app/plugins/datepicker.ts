import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import '@/assets/css/modules/datepicker.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('DatePicker', VueDatePicker);
});
