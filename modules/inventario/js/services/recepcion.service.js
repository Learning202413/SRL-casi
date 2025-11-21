/**
 * js/services/recepcion.service.js
 * Servicio para la recepción de OCs y actualización de stock.
 * CORRECCIÓN: Asegura que el stock se sume matemáticamente y registra LOG.
 */
import { getStorage, setStorage, log } from '../../../admin/js/services/local.db.js';

const DB_KEY_ITEMS = 'inv_items';
const DB_KEY_OCS = 'inv_ocs';

export const RecepcionService = {
    
    async getPendingOCs() {
        const ocs = getStorage(DB_KEY_OCS, []);
        return ocs.filter(oc => oc.estado === 'Enviada' || oc.estado === 'Parcial');
    },

    async getOCById(id) {
        const ocs = getStorage(DB_KEY_OCS, []);
        return ocs.find(oc => oc.id === id);
    },

    async receiveOC(ocId, itemsReceived, comentarios) {
        const ocs = getStorage(DB_KEY_OCS, []);
        const products = getStorage(DB_KEY_ITEMS, []);
        
        const ocIndex = ocs.findIndex(o => o.id === ocId);
        if (ocIndex === -1) return { success: false, message: 'OC no encontrada' };

        // 1. Actualizar Stock
        itemsReceived.forEach(recItem => {
            const prodIndex = products.findIndex(p => p.nombre.trim().toLowerCase() === recItem.producto.trim().toLowerCase());
            
            if (prodIndex !== -1) {
                // BLINDAJE: Convertir a número antes de sumar
                const currentStock = parseInt(products[prodIndex].stock) || 0;
                const receivedQty = parseInt(recItem.cantidad) || 0;
                
                products[prodIndex].stock = currentStock + receivedQty;
            }
        });

        // 2. Actualizar OC
        const now = new Date().toLocaleString();
        ocs[ocIndex].estado = 'Recibida (Completa)'; 
        ocs[ocIndex].fecha_recepcion = now;
        ocs[ocIndex].comentarios_recepcion = comentarios;

        // 3. Guardar
        setStorage(DB_KEY_ITEMS, products);
        setStorage(DB_KEY_OCS, ocs);
        
        // [LOG] Auditoría
        log('RECEPCION_COMPRA', `OC ${ocId} recibida y procesada. Stock actualizado.`);

        return { success: true };
    }
};