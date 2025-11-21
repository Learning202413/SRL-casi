/**
 * js/services/detalle.service.js
 * Servicio de Pre-Prensa.
 * CORREGIDO: Ahora guarda 'fecha_envio_aprobacion' al completar el paso 3.
 */
import { LocalDB } from './local.db.js';

const getTimestamp = () => new Date().toLocaleString('es-PE', { 
    year: 'numeric', month: '2-digit', day: '2-digit', 
    hour: '2-digit', minute: '2-digit', second: '2-digit', 
    hour12: true 
});

export const DetalleService = {
    async getTaskById(id) {
        return new Promise(resolve => {
            let order = LocalDB.getById(id);
            if (!order) { resolve(null); return; }

            const taskView = {
                id: order.id,
                ot_id: order.ot_id,
                cliente: order.cliente_nombre,
                producto: order.items && order.items[0] ? order.items[0].producto : 'Varios',
                specs: order.items && order.items[0] ? order.items[0].specs : 'N/A',
                pasos: order.pasos_preprensa || { 1: false, 2: false, 3: false, 4: false },
                comentarios: order.comentarios || [],
                estado_global: order.estado
            };
            setTimeout(() => resolve(taskView), 100);
        });
    },

    async updateStepStatus(id, stepNumber, isCompleted) {
        const now = getTimestamp();
        const order = LocalDB.getById(id);
        if (!order) return false;

        const currentSteps = order.pasos_preprensa || { 1: false, 2: false, 3: false, 4: false };
        const newSteps = { ...currentSteps, [stepNumber]: isCompleted };
        
        let updates = { 
            pasos_preprensa: newSteps, 
            ultima_actualizacion: now 
        };

        // --- AQUÍ ESTÁ LA CORRECCIÓN ---
        if (stepNumber === 3 && isCompleted) {
            updates.estado = 'En Aprobación de Cliente';
            updates.fecha_envio_aprobacion = now; // Guardamos la fecha para el historial
        }

        LocalDB.update(id, updates);
        return true;
    },

    async setApprovalStatus(id, tipo) {
        const now = getTimestamp();
        let updates = { ultima_actualizacion: now };
        updates.estado = (tipo === 'aprobado') ? 'Diseño Aprobado' : 'Cambios Solicitados';
        LocalDB.update(id, updates);
        return true;
    },

    async completeTask(id) {
        const now = getTimestamp();
        return LocalDB.update(id, { 
            estado: 'En prensa', 
            fecha_pase_prensa: now,
            ultima_actualizacion: now
        });
    }
};