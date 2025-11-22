/**
 * js/services/recepcion.service.js
 * Servicio actualizado: Búsqueda robusta de proveedores para PDF
 */
import { getStorage, setStorage, log } from '../../../admin/js/services/local.db.js';
// Asegúrate que esta ruta sea correcta según tu estructura de carpetas
import { providersDB } from '../../../admin/js/services/providers.db.js';

const DB_KEY_ITEMS = 'inv_items';
const DB_KEY_OCS = 'inv_ocs';

export const RecepcionService = {
    
    async getPendingOCs() {
        const ocs = getStorage(DB_KEY_OCS, []);
        return ocs.filter(oc => oc.estado !== 'Cancelada');
    },

    async getOCById(id) {
        const ocs = getStorage(DB_KEY_OCS, []);
        return ocs.find(oc => oc.id === id);
    },

    // --- FUNCIÓN MEJORADA PARA EL PDF ---
    async getOCForPDF(ocId) {
        const ocs = getStorage(DB_KEY_OCS, []);
        const oc = ocs.find(o => o.id === ocId);

        if (!oc) return { success: false, message: 'Orden de Compra no encontrada' };

        // 1. OBTENER PROVEEDORES
        const allProviders = await providersDB.getProviders();
        
        // --- LÓGICA DE BÚSQUEDA INTELIGENTE ---
        // Normalizamos texto: minúsculas, sin espacios extra, sin puntos ni comas
        const normalize = (txt) => {
            if (!txt) return '';
            return txt.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        };

        const ocName = normalize(oc.proveedor_nombre);
        
        let providerFound = allProviders.find(p => {
            // 1. Intento por ID exacto
            if (oc.proveedor_id && String(p.id) === String(oc.proveedor_id)) return true;
            
            // 2. Intento por Nombre normalizado exacto
            const pName = normalize(p.name);
            if (pName === ocName) return true;

            // 3. Intento por contenencia (Si "Juan" está dentro de "Ferretería Juan")
            if (pName.includes(ocName) || ocName.includes(pName)) return true;

            return false;
        });

        // 2. DEFINIR RUC Y DIRECCIÓN
        // Valores por defecto visuales si todo falla
        let rucFinal = '---';
        let direccionFinal = '---';

        if (providerFound) {
            console.log(`[PDF] ÉXITO: Proveedor vinculado: ${providerFound.name}`);
            console.log(`[PDF] Datos recuperados -> RUC: ${providerFound.taxId}, DIR: ${providerFound.address}`);
            
            rucFinal = providerFound.taxId || providerFound.ruc || 'SIN RUC';
            // IMPORTANTE: Buscamos 'address' (DB estándar) O 'direccion' (API directa)
            direccionFinal = providerFound.address || providerFound.direccion || 'DIRECCIÓN NO REGISTRADA';
        } else {
            console.warn(`[PDF] ALERTA: No se encontró proveedor para "${oc.proveedor_nombre}".`);
            console.log("Nombres en DB:", allProviders.map(p => normalize(p.name)));
            console.log("Buscando:", ocName);

            // Fallback: Usar datos históricos de la OC si existen
            rucFinal = oc.proveedor_ruc || oc.proveedor_doc || '00000000000';
            direccionFinal = oc.proveedor_direccion || 'DIRECCIÓN NO ESPECIFICADA';
        }

        // Formateo extra de dirección
        if (direccionFinal !== '---' && oc.proveedor_distrito) {
            // Solo agregamos distrito si no es redundante
            if (!direccionFinal.toLowerCase().includes(oc.proveedor_distrito.toLowerCase())) {
                direccionFinal += ` - ${oc.proveedor_distrito}`;
            }
        }

        // 3. CÁLCULOS DE MONTOS
        let totalFinal = parseFloat(oc.total);
        if (isNaN(totalFinal) || totalFinal === 0) {
            totalFinal = oc.items.reduce((sum, item) => sum + (parseFloat(item.precio || 0) * parseFloat(item.cantidad || 0)), 0);
        }
        const subtotal = totalFinal / 1.18;
        const igv = totalFinal - subtotal;

        // 4. RETORNAR DATOS
        return {
            success: true,
            data: {
                id: oc.id,
                numero: `OC-${oc.id}`,
                fecha_emision: oc.fecha,
                
                proveedor_nombre: providerFound ? providerFound.name : oc.proveedor_nombre, 
                proveedor_doc: rucFinal,
                proveedor_direccion: direccionFinal.toUpperCase(),
                proveedor_email: oc.proveedor_email || (providerFound ? providerFound.email : ''),

                subtotal: subtotal.toFixed(2),
                igv: igv.toFixed(2),
                total: totalFinal.toFixed(2),
                items: oc.items || []
            }
        };
    },

    async receiveOC(ocId, itemsReceived, comentarios) {
        const ocs = getStorage(DB_KEY_OCS, []);
        const products = getStorage(DB_KEY_ITEMS, []);
        
        const ocIndex = ocs.findIndex(o => o.id === ocId);
        if (ocIndex === -1) return { success: false, message: 'OC no encontrada' };

        itemsReceived.forEach(recItem => {
            const prodIndex = products.findIndex(p => p.nombre.trim().toLowerCase() === recItem.producto.trim().toLowerCase());
            if (prodIndex !== -1) {
                const currentStock = parseInt(products[prodIndex].stock) || 0;
                const receivedQty = parseInt(recItem.cantidad) || 0;
                products[prodIndex].stock = currentStock + receivedQty;
            }
        });

        const now = new Date().toLocaleString();
        ocs[ocIndex].estado = 'Recibida (Completa)'; 
        ocs[ocIndex].fecha_recepcion = now;
        ocs[ocIndex].comentarios_recepcion = comentarios;

        setStorage(DB_KEY_ITEMS, products);
        setStorage(DB_KEY_OCS, ocs);
        log('RECEPCION_COMPRA', `OC ${ocId} recibida. Stock actualizado.`);
        return { success: true };
    }
};