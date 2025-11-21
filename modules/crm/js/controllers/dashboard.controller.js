/**
 * js/controllers/dashboard.controller.js
 * Controlador para la vista del dashboard (KPIs).
 * AHORA: Conectado a datos reales vía DashboardService.
 */
import { DashboardService } from '../services/dashboard.service.js';

export const DashboardController = {
    init: async function() {
        console.log("DashboardController (CRM) inicializado con datos reales.");
        
        try {
            await this.loadKpis();
            this.setupEvents(); // Por si agregamos interactividad luego
        } catch (error) {
            console.error("Error cargando KPIs:", error);
        }
    },

    async loadKpis() {
        // 1. Llamada al servicio real
        const data = await DashboardService.getKpiStats();

        // 2. Referencias al DOM (IDs definidos en dashboard.html)
        const totalQuotesEl = document.getElementById('kpi-total-quotes');
        const totalOTsEl = document.getElementById('kpi-total-ots'); 
        const inProductionEl = document.getElementById('kpi-in-production');
        const completedEl = document.getElementById('kpi-completed');

        // 3. Animación simple de contador (Opcional, pero se ve bien)
        this.animateValue(totalQuotesEl, 0, data.totalQuotes, 500);
        this.animateValue(totalOTsEl, 0, data.totalOTs, 500);
        this.animateValue(inProductionEl, 0, data.inProduction, 500);
        this.animateValue(completedEl, 0, data.completedMonth, 500);
    },

    // Utilidad para animar números incrementales
    animateValue(obj, start, end, duration) {
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.textContent = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.textContent = end; // Asegurar valor final exacto
            }
        };
        window.requestAnimationFrame(step);
    },

    setupEvents() {
        // Aquí podrías agregar listeners si los cuadros fueran clickeables
        // para llevar a listas filtradas, por ejemplo.
    }
};