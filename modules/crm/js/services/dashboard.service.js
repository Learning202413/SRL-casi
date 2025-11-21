/**
 * js/services/dashboard.service.js
 * Servicio para calcular métricas y KPIs del Dashboard.
 * Consume datos reales de OrdenesService.
 */
import { OrdenesService } from './ordenes.service.js';

export const DashboardService = {
    
    /**
     * Calcula los contadores principales para los KPIs.
     */
    async getKpiStats() {
        // 1. Obtener todas las órdenes guardadas
        const allOrders = await OrdenesService.getAllOrders();
        
        // 2. Definir grupos de estados
        const quoteStates = ['Nueva', 'En Negociación'];
        const productionStates = ['Orden creada', 'En Pre-prensa', 'En prensa', 'En post-prensa'];
        const completedState = 'Completado';

        // 3. Inicializar contadores
        let stats = {
            totalQuotes: 0,      // Cotizaciones activas
            totalOTs: 0,         // Total OTs (Producción + Completadas)
            inProduction: 0,     // Solo en producción activa
            completedMonth: 0    // Completadas en el mes actual
        };

        // 4. Fechas para filtro de "Mes actual"
        const now = new Date();
        const currentMonth = now.getMonth(); // 0-11
        const currentYear = now.getFullYear();

        // 5. Recorrer y calcular
        allOrders.forEach(order => {
            // A) Cotizaciones Activas
            if (quoteStates.includes(order.estado)) {
                stats.totalQuotes++;
            }
            
            // B) Órdenes de Trabajo (Cualquier estado post-cotización)
            const isProduction = productionStates.includes(order.estado);
            const isCompleted = order.estado === completedState;

            if (isProduction || isCompleted) {
                stats.totalOTs++;
            }

            // C) En Producción (Activa)
            if (isProduction) {
                stats.inProduction++;
            }

            // D) Completadas (Solo este mes)
            if (isCompleted) {
                // Asumimos que fecha_creacion es 'YYYY-MM-DD'. 
                // Idealmente usaríamos una fecha_finalizacion, pero usaremos creación como referencia simple
                // o si tienes fecha de actualización, úsala.
                const orderDate = new Date(order.fecha_creacion); 
                if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
                    stats.completedMonth++;
                }
            }
        });

        return stats;
    }
};