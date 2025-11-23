import { LocalDB } from './local.db.js';

const getTimestamp = () => new Date().toLocaleString('es-PE', { 
    hour12: true, 
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
});

export const OperadorService = {
    async getTaskById(id) {
        return new Promise(resolve => {
            const order = LocalDB.getById(id);
            if (!order) { resolve(null); return; }

            const taskView = {
                id: order.id,
                ot_id: order.ot_id,
                cliente: order.cliente_nombre,
                producto: order.items && order.items[0] ? order.items[0].producto : 'Varios',
                paper: order.items && order.items[0] ? (order.items[0].specs || 'N/A') : 'N/A',
                estado_prensa: order.estado,
                tiempos: {
                    prep: order.fecha_inicio_prep,
                    print: order.fecha_inicio_print
                }
            };
            setTimeout(() => resolve(taskView), 100);
        });
    },

    async startPreparation(id) {
        const now = getTimestamp();
        return LocalDB.update(id, { 
            estado: 'En Preparación',
            fecha_inicio_prep: now
        });
    },

    async startPrinting(id) {
        const now = getTimestamp();
        return LocalDB.update(id, { 
            estado: 'Imprimiendo',
            fecha_inicio_print: now
        });
    },

    async reportIncident(id, details, type) {
        const now = getTimestamp();
        const order = LocalDB.getById(id);
        const incidencias = order.incidencias_prensa || [];
        incidencias.push({ fecha: now, tipo: type, detalle: details });
        return LocalDB.update(id, { incidencias_prensa: incidencias });
    },

    async finishJob(id, consumo, desperdicio) {
        const now = getTimestamp();
        // AL FINALIZAR: Pasa a 'En Post-Prensa'.
        // Al no tener 'asignado_postprensa', el Admin lo verá en "Sin Asignar".
        return LocalDB.update(id, { 
            estado: 'En Post-Prensa',
            fecha_fin_prensa: now,
            consumo_papel: consumo,
            desperdicio_papel: desperdicio,
            ultima_actualizacion: now
        });
    }
};