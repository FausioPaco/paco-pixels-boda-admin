import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

export default defineNuxtPlugin(() => {
  // Registo global (só no cliente, pois este ficheiro é *.client.ts)
  ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Filler,
    ChartDataLabels,
  );

  // Defaults coerentes com Tailwind
  ChartJS.defaults.font.family = 'inherit';
  ChartJS.defaults.plugins.legend.display = false;
  // ChartJS.defaults.animation.duration = 300;

  // Datalabels: default OFF (activamos por chart quando fizer sentido)
  // ChartJS.defaults.plugins.datalabels.display = false;
});
