import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default defineNuxtPlugin(() => {
  return {
    provide: {
      jsPDF,
      html2canvas,
    },
  };
});
