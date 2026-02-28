import { Chart as ChartJS, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

export default defineNuxtPlugin(() => {
  ChartJS.register(...registerables, ChartDataLabels);

  ChartJS.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
  ChartJS.defaults.plugins.legend.display = false;

  // ✅ datalabels TS-safe
  ChartJS.defaults.set('plugins.datalabels', { display: false });
});
