/**
 * js/services/clientes.service.js
 * Servicio de Clientes.
 */
import { getStorage, setStorage, log } from './local.db.js';

const SEED_CLIENTS = [
    { id: '1', ruc: '20123456789', razon_social: 'Industrias Gráficas S.A.', nombre_contacto: 'Carlos Pérez', email: 'carlos.perez@ig.com', telefono: '+51 987 654 321', estado: 'Activo' },
    { id: '2', ruc: '10987654321', razon_social: 'Editorial Futuro EIRL', nombre_contacto: 'Elena Ríos', email: 'erios@editorial.pe', telefono: '+51 900 111 222', estado: 'Activo' },
    { id: '3', ruc: '10445566778', razon_social: 'Juan Pérez (Persona Natural)', nombre_contacto: 'Juan Pérez', email: 'juan@mail.com', telefono: '999888777', estado: 'Activo' },
    { id: '4', ruc: '20556677889', razon_social: 'Minera del Centro S.A.C.', nombre_contacto: 'Ing. Salas', email: 'logistica@minera.com', telefono: '064-223344', estado: 'Activo' },
    { id: '5', ruc: '20667788990', razon_social: 'Colegio San Agustín', nombre_contacto: 'Sor María', email: 'admin@sanagustin.edu.pe', telefono: '064-556677', estado: 'Activo' }
];

const DB_KEY = 'crm_clients';

export const ClientesService = {
    async getAllClients() {
        return new Promise(resolve => {
            const data = getStorage(DB_KEY, SEED_CLIENTS);
            setTimeout(() => resolve(data), 200);
        });
    },

    /**
     * Búsqueda optimizada.
     * Si query es vacío, retorna los primeros 10 (simula desplegar lista).
     */
    async searchClients(query) {
        return new Promise(resolve => {
            const all = getStorage(DB_KEY, SEED_CLIENTS);
            
            if (!query || query.trim() === '') {
                // Retornar los primeros 10 por defecto para el "Click"
                setTimeout(() => resolve(all.slice(0, 10)), 100);
                return;
            }

            const lowerQ = query.toLowerCase();
            const results = all.filter(c => 
                c.razon_social.toLowerCase().includes(lowerQ) || 
                c.ruc.includes(lowerQ)
            );

            setTimeout(() => resolve(results), 200);
        });
    },

    async getClientById(id) {
        const all = getStorage(DB_KEY, SEED_CLIENTS);
        return all.find(c => c.id === id) || null;
    },

    async deleteClient(id) {
        let clients = getStorage(DB_KEY, SEED_CLIENTS);
        const initialLength = clients.length;
        clients = clients.filter(c => c.id !== id);
        
        if (clients.length < initialLength) {
            setStorage(DB_KEY, clients);
            log('CLIENTE_ELIMINADO', `ID eliminado: ${id}`);
            return { success: true };
        }
        return { success: false, message: 'Cliente no encontrado' };
    }
};