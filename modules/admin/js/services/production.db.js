/**
 * js/services/production.db.js
 * Lógica de persistencia de Órdenes de Trabajo (OTs).
 * CORREGIDO: Asignación de Post-Prensa para el estado 'Pendiente'.
 */
import { getStorage, setStorage, log } from './local.db.js';

const DB_KEY = 'crm_orders';

export const productionDB = {
    async getOTs() {
        const allOrders = getStorage(DB_KEY, []);
        return allOrders.filter(order => {
            const s = order.estado;
            return s !== 'Nueva' && s !== 'En Negociación' && s !== 'Rechazada';
        });
    },

    async assignOT(otId, userId, userName, newStatus, assignmentTime) {
        let ots = getStorage(DB_KEY, []);
        const index = ots.findIndex(ot => ot.id === otId || ot.ot_id === otId);
        
        if (index !== -1) {
            let updates = { 
                estado: newStatus,
                fecha_asignacion_global: assignmentTime || new Date().toLocaleString()
            };

            if (newStatus.includes('Diseño') || newStatus.includes('Pre-Prensa')) {
                updates.asignado_a = userId; 
                updates.asignado_nombre_preprensa = userName;
            } 
            else if (newStatus.includes('Prensa') || newStatus.includes('Imprimiendo')) {
                updates.asignado_prensa = userId; 
                updates.asignado_nombre_prensa = userName;
            } 
            // --- CORRECCIÓN AQUÍ: Incluir 'Pendiente' explícitamente para Post-Prensa ---
            else if (newStatus === 'Pendiente' || newStatus.includes('Acabados') || newStatus.includes('Post')) {
                updates.asignado_postprensa = userId; 
                updates.asignado_nombre_postprensa = userName;
            }

            updates.assignedTo = userId;
            updates.assignedName = userName;

            ots[index] = { ...ots[index], ...updates };
            setStorage(DB_KEY, ots);
            
            log('OT_ASIGNADA', `${ots[index].ot_id || otId} asignada a ${userName} con estado: ${newStatus}`);
            return { success: true };
        }
        return { success: false };
    },

    async getUserLoad(userId) {
        const ots = await this.getOTs();
        return ots.filter(ot => 
            (ot.asignado_a === userId || ot.asignado_prensa === userId || ot.asignado_postprensa === userId) && 
            ot.estado !== 'Completado'
        ).length;
    },

    async getDashboardStats() {
        const ots = await this.getOTs();
        return {
            totalOTs: ots.length,
            pendingOTs: ots.filter(ot => 
                ot.estado === 'Orden creada' || 
                ot.estado.includes('Pendiente') || 
                ot.estado.includes('Listo')
            ).length
        };
    },

    async getProductionTrend() {
        const allOrders = getStorage(DB_KEY, []);
        
        const months = [];
        const now = new Date();
        for (let i = 3; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                monthIndex: d.getMonth(),
                year: d.getFullYear(),
                label: d.toLocaleString('es-PE', { month: 'short' }),
                count: 0
            });
        }

        const completedOrders = allOrders.filter(o => o.estado === 'Completado');

        completedOrders.forEach(order => {
            const dateStr = order.fecha_fin_proceso || order.fecha_creacion;
            if (!dateStr) return;

            const dateObj = this._parseDate(dateStr);
            if (!dateObj) return;

            const monthBucket = months.find(m => 
                m.monthIndex === dateObj.getMonth() && 
                m.year === dateObj.getFullYear()
            );

            if (monthBucket) {
                monthBucket.count++;
            }
        });

        return months;
    },

    _parseDate(dateStr) {
        if (dateStr.includes('T')) return new Date(dateStr);
        try {
            let clean = dateStr.replace(',', '').trim();
            let parts = clean.split(' ');
            let [d, m, y] = parts[0].split('/').map(Number);
            return new Date(y, m - 1, d);
        } catch (e) { return null; }
    }
};