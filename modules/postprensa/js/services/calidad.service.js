/**
 * js/services/calidad.service.js
 * Servicio para la lógica de Control de Calidad (Post-Prensa).
 * Encapsula la obtención de datos y la actualización de los pasos de avance/finalización.
 */
import { LocalDB } from './local.db.js';

const getTimestamp = () => new Date().toLocaleString('es-PE', { 
    hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit', 
    day: '2-digit', month: '2-digit', year: 'numeric'
});

export const CalidadService = {
    
    /** Obtiene los datos crudos de la OT para la vista de detalle. */
    async getTaskData(id) {
        return LocalDB.getById(id);
    },

    /**
     * Actualiza el estado de un paso específico y devuelve la tarea actualizada.
     */
    async updateStep(id, stepKey, currentAvance) {
        const now = getTimestamp();
        
        const updates = {
            avance_postprensa: { ...currentAvance, [stepKey]: true },
            ultima_actualizacion: now
        };

        if (stepKey === 'paso3') {
            updates.estado = 'En Control de Calidad';
            updates.fecha_inicio_calidad = now;
        }

        const success = await LocalDB.update(id, updates);
        // Devuelve la tarea fresca desde la DB si fue exitoso
        return success ? LocalDB.getById(id) : null; 
    },

    /**
     * Marca la orden como completada en el sistema.
     */
    async completeOrder(id) {
        const now = getTimestamp();
        // AL FINALIZAR: Pasa a 'Completado' (estado final para el CRM)
        const success = await LocalDB.update(id, { 
            estado: 'Completado',          
            fecha_fin_proceso: now,        
            ultima_actualizacion: now
        });
        return success;
    }
};