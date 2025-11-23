/**
 * js/services/providers.db.js
 * Lógica de persistencia de proveedores.
 * MODIFICADO: Se agregaron direcciones a los datos semilla (Seed Data).
 */
import { getStorage, setStorage, log } from './local.db.js';

// --- Datos Iniciales con DIRECCIONES ---
const SEED_PROVIDERS = [
    { 
        id: 'p1', 
        name: 'Proveedor de Papeles S.A.', 
        taxId: '20100100100', 
        address: 'AV. INDUSTRIAL 123, LIMA', // <--- Campo Nuevo
        contact: 'Juan Mendoza', 
        insumos: 'Papel Couche, Bond' 
    },
    { 
        id: 'p2', 
        name: 'Tintas Importadas SAC', 
        taxId: '20200200200', 
        address: 'JR. LOS ALAMOS 456, SURCO', // <--- Campo Nuevo
        contact: 'Rosa Lopez', 
        insumos: 'Tintas CMYK, Barniz' 
    },
];

export const providersDB = {
    async getProviders() {
        return getStorage('admin_providers', SEED_PROVIDERS);
    },
    
    async addProvider(provider) {
        const providers = await this.getProviders();
        const newProvider = { ...provider, id: `p${Date.now()}` };
        providers.push(newProvider);
        setStorage('admin_providers', providers);
        log('PROVEEDOR_CREADO', `Se registró ${newProvider.name}`);
        return { success: true };
    },

    async updateProvider(id, updates) {
        let providers = await this.getProviders();
        const index = providers.findIndex(p => p.id === id);
        if (index !== -1) {
            const currentName = providers[index].name;
            providers[index] = { ...providers[index], ...updates };
            setStorage('admin_providers', providers);
            log('PROVEEDOR_ACTUALIZADO', `Se actualizaron datos de ${currentName}`);
            return { success: true };
        }
        return { success: false };
    },

    async deleteProvider(id) {
        let providers = await this.getProviders();
        const provider = providers.find(p => p.id === id);
        if (provider) {
            providers = providers.filter(p => p.id !== id);
            setStorage('admin_providers', providers);
            log('PROVEEDOR_ELIMINADO', `Se eliminó a ${provider.name}`);
            return { success: true };
        }
        return { success: false };
    },

    async getTotalProviders() {
        const providers = await this.getProviders();
        return providers.length;
    }
};