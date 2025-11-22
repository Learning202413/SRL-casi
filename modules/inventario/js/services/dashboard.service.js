/**
 * js/services/dashboard.service.js
 * Servicio para calcular KPIs del Dashboard de Inventario.
 */
import { getStorage } from '../../../admin/js/services/local.db.js';

const DB_KEY_ITEMS = 'inv_items';
const DB_KEY_OCS = 'inv_ocs';

export const DashboardService = {
    async getKPIs() {
        return new Promise(resolve => {
            const products = getStorage(DB_KEY_ITEMS, []);
            const ocs = getStorage(DB_KEY_OCS, []);

            // 1. Alerta Stock Crítico (Stock <= Mínimo)
            const criticalCount = products.filter(p => {
                const stock = parseInt(p.stock) || 0;
                const min = parseInt(p.min) || 0;
                return stock <= min;
            }).length;

            // 2. OCs Pendientes (Estado: Enviada o Parcial)
            const pendingOCs = ocs.filter(oc => 
                oc.estado === 'Enviada' || oc.estado === 'Parcial'
            ).length;

            // 3. Total de Insumos (SKUs únicos)
            const totalItems = products.length;

            // 4. Próximos a Agotar (Stock <= 1.5 * Mínimo, pero mayor que Mínimo)
            // Nota: Excluimos los críticos para no duplicar alertas
            const nearDepletion = products.filter(p => {
                const stock = parseInt(p.stock) || 0;
                const min = parseInt(p.min) || 0;
                return stock > min && stock <= (min * 1.5);
            }).length;

            resolve({
                criticalCount,
                pendingOCs,
                totalItems,
                nearDepletion
            });
        });
    }
};