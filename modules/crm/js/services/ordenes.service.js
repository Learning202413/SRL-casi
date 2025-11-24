/**
 * js/services/ordenes.service.js
 * Servicio para el controlador de LISTA de órdenes.
 * Gestiona la obtención y filtrado masivo.
 */
import { getStorage, setStorage, log } from './local.db.js';

const DB_KEY = 'crm_orders';

// Datos semilla actualizados con tus NUEVOS ESTADOS
const SEED_ORDERS = [
    { 
        id: 'B4A5C6D7', 
        codigo: 'COT-B4A5C6D7',
        ot_id: 'PENDIENTE',
        cliente_id: '2',
        cliente_nombre: 'Editorial Futuro EIRL',
        estado: 'En Negociación', // Cotización activa
        fecha_creacion: '2025-11-15',
        total: 9800.00,
        items: [
            { producto: 'Libro Tapa Dura', cantidad: 500, precio: 19.60 }
        ]
    },
    { 
        id: '1234', 
        codigo: 'COT-GEN-1234',
        ot_id: 'OT-1234',
        cliente_id: '1',
        cliente_nombre: 'Industrias Gráficas S.A.',
        estado: 'En prensa', // <--- CORREGIDO: Antes era 'En Producción'
        fecha_creacion: '2025-11-10',
        total: 4500.00,
        items: [
            { producto: 'Revistas A4', cantidad: 1000, precio: 4.50 }
        ]
    },
    { 
        id: 'OT-9988', 
        codigo: 'COT-PRE-9988',
        ot_id: 'OT-9988',
        cliente_id: '4',
        cliente_nombre: 'Minera del Centro S.A.C.',
        estado: 'Orden creada', // <--- NUEVO: Otro ejemplo para ver variedad
        fecha_creacion: '2025-11-18',
        total: 1250.00,
        items: [
            { producto: 'Manuales de Seguridad', cantidad: 50, precio: 25.00 }
        ]
    },
    { 
        id: 'C1A2B3D4', 
        codigo: 'COT-C1A2B3D4',
        ot_id: 'PENDIENTE',
        cliente_id: '3',
        cliente_nombre: 'Cliente Ejemplo 3',
        estado: 'Rechazada',
        fecha_creacion: '2025-11-01',
        total: 1200.00,
        items: []
    }
];

export const OrdenesService = {
    /**
     * Obtiene todas las órdenes.
     */
    async getAllOrders() {
        return new Promise(resolve => {
            // Nota: Si ya tienes datos guardados en el LocalStorage del navegador con el estado viejo,
            // podrías necesitar borrar el LocalStorage o usar una nueva ventana de incógnito 
            // para ver estos cambios reflejados, ya que el getStorage prioriza lo guardado.
            const data = getStorage(DB_KEY, SEED_ORDERS);
            setTimeout(() => resolve(data), 200);
        });
    },

    /**
     * Elimina una orden (lógica administrativa).
     */
    async deleteOrder(id) {
        let orders = getStorage(DB_KEY, SEED_ORDERS);
        const initialLen = orders.length;
        orders = orders.filter(o => o.id !== id);
        
        if (orders.length < initialLen) {
            setStorage(DB_KEY, orders);
            log('ORDEN_ELIMINADA', `ID: ${id}`);
            return { success: true };
        }
        return { success: false };
    }
};