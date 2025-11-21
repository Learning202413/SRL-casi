/**
 * js/services/cliente.detalle.service.js
 * Servicio específico para el controlador de DETALLE de cliente.
 * Se encarga de buscar por ID, crear nuevos registros y actualizar existentes.
 */
import { getStorage, setStorage, log } from './local.db.js';

// Replicamos la semilla y la key para asegurar consistencia si entran directo al detalle
const SEED_CLIENTS = [
    { id: '1', ruc: '20123456789', razon_social: 'Industrias Gráficas S.A.', nombre_contacto: 'Carlos Pérez', email: 'carlos.perez@ig.com', telefono: '+51 987 654 321', estado: 'Activo' },
    { id: '2', ruc: '10987654321', razon_social: 'Editorial Futuro EIRL', nombre_contacto: 'Elena Ríos', email: 'erios@editorial.pe', telefono: '+51 900 111 222', estado: 'Activo' }
];

const DB_KEY = 'crm_clients';

export const ClienteDetalleService = {
    /**
     * Busca un cliente específico por su ID.
     */
    async getClientById(id) {
        return new Promise(resolve => {
            const clients = getStorage(DB_KEY, SEED_CLIENTS);
            const found = clients.find(c => c.id === id);
            setTimeout(() => resolve(found || null), 100);
        });
    },

    /**
     * Crea un nuevo cliente.
     */
    async createClient(clientData) {
        const clients = getStorage(DB_KEY, SEED_CLIENTS);
        
        const newClient = { 
            ...clientData, 
            id: Date.now().toString(), // Generación de ID
            estado: 'Activo'
        };
        
        clients.push(newClient);
        setStorage(DB_KEY, clients);
        log('CLIENTE_CREADO', `Nombre: ${newClient.razon_social}`);
        return { success: true, id: newClient.id };
    },

    /**
     * Actualiza un cliente existente.
     */
    async updateClient(id, updates) {
        let clients = getStorage(DB_KEY, SEED_CLIENTS);
        const index = clients.findIndex(c => c.id === id);
        
        if (index === -1) return { success: false, message: 'Cliente no encontrado' };

        // Fusión de datos (spread operator)
        clients[index] = { ...clients[index], ...updates };
        
        setStorage(DB_KEY, clients);
        log('CLIENTE_ACTUALIZADO', `ID: ${id}`);
        return { success: true };
    }
};