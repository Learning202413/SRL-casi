/**
 * js/services/dashboard.service.js
 * Servicio ACTUALIZADO para métricas del Dashboard.
 * Lógica:
 * 1. Cotizaciones: Solo 'Nueva' o 'En Negociación'.
 * 2. En Producción: Cualquier estado de proceso (desde 'Orden creada' hasta 'Control de Calidad').
 * 3. Rechazadas: 'Rechazada' o 'Cancelada'.
 * 4. Completadas: 'Completado'.
 */
import { OrdenesService } from './ordenes.service.js';

export const DashboardService = {
    
    async getKpiStats() {
        // 1. Obtener datos
        const allOrders = await OrdenesService.getAllOrders();
        
        // 2. Listas de Estados
        const quoteStates = ['Nueva', 'En Negociación'];
        const rejectedStates = ['Rechazada', 'Cancelada'];
        const completedState = 'Completado';
        
        // Todos los estados intermedios se consideran "En Producción"
        const productionStates = [
            'Orden creada', 'Diseño Pendiente', 'En diseño', 'En Aprobación de Cliente', 
            'Diseño Aprobado', 'Cambios Solicitados', 'En Pre-prensa', 'Asignada a Prensa', 
            'En Preparación', 'Imprimiendo', 'En proceso', 'En prensa',
            'En Post-Prensa', 'En Acabados', 'En Control de Calidad'
        ];

        // 3. Inicializar contadores
        let stats = {
            activeQuotes: 0,    // Cotizaciones
            activeProduction: 0,// OTs en curso
            totalRejected: 0,   // Rechazadas
            totalCompleted: 0   // Completadas
        };

        // 4. Calcular
        allOrders.forEach(order => {
            const status = order.estado;

            if (quoteStates.includes(status)) {
                stats.activeQuotes++;
            } 
            else if (productionStates.includes(status)) {
                stats.activeProduction++;
            } 
            else if (rejectedStates.includes(status)) {
                stats.totalRejected++;
            } 
            else if (status === completedState) {
                stats.totalCompleted++;
            }
        });

        return stats;
    }
};