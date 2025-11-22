/**
 * js/services/local.db.js
 * Servicio base de persistencia (LocalStorage).
 * ACTUALIZADO: Soporta Órdenes, Flujo de Producción y Facturación.
 */

// --- CONSTANTES DE ALMACENAMIENTO ---
const DB_KEY = 'crm_orders';      // Para Cotizaciones y OTs
const INV_KEY = 'crm_invoices';   // Para Facturas y Boletas

// --- 1. FUNCIONES BASE (Low Level) ---
// Mantenemos estas exportaciones para compatibilidad con tus servicios antiguos
export const getStorage = (key, seed = []) => {
    const data = localStorage.getItem(key);
    if (!data) {
        if (seed) localStorage.setItem(key, JSON.stringify(seed));
        return seed;
    }
    return JSON.parse(data);
};

export const setStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const log = (action, details) => {
    console.log(`[SYSTEM LOG] ${action}: ${details}`);
};

// --- 2. OBJETO DE GESTIÓN CENTRALIZADA (High Level) ---
// Este objeto es el que usan los controladores nuevos (Facturación, Calidad, Prensa)
export const LocalDB = {
    
    // ==========================
    // MÉTODOS PARA ÓRDENES (OTs)
    // ==========================
    
    /** Obtiene todas las órdenes */
    getAll() {
        return getStorage(DB_KEY, []);
    },

    /** Busca una orden por ID único o por código de OT */
    getById(id) {
        const all = this.getAll();
        // Buscamos coincidencia flexible (string vs number)
        return all.find(item => item.id == id || item.ot_id == id) || null;
    },

    /** * Actualiza una orden existente.
     * Mezcla los datos nuevos con los antiguos (merge).
     */
    update(id, updates) {
        let all = this.getAll();
        const index = all.findIndex(item => item.id == id || item.ot_id == id);
        
        if (index !== -1) {
            // Creamos una copia del objeto actualizado
            const updatedItem = { ...all[index], ...updates };
            all[index] = updatedItem;
            
            setStorage(DB_KEY, all);
            log('UPDATE_ORDER', `ID: ${id} - Cambios: ${Object.keys(updates).join(', ')}`);
            return true;
        }
        return false;
    },

    /** Guarda o sobrescribe todo el array de órdenes (Uso administrativo) */
    saveAll(data) {
        setStorage(DB_KEY, data);
    },

    // ==============================
    // MÉTODOS PARA FACTURACIÓN
    // ==============================

    /** Obtiene todas las facturas/boletas emitidas */
    getAllInvoices() {
        return getStorage(INV_KEY, []);
    },

    /** Guarda un nuevo documento fiscal */
    saveInvoice(invoice) {
        const all = this.getAllInvoices();
        all.push(invoice);
        setStorage(INV_KEY, all);
        log('NEW_INVOICE', `Doc: ${invoice.numero} para OT: ${invoice.ot_id}`);
    }
};