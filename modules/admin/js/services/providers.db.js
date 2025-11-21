/**
 * js/services/providers.db.js
 * Lógica de persistencia de proveedores.
 */
import { getStorage, setStorage, log } from './local.db.js';

// --- Datos Iniciales (Seed Data) ---
const SEED_PROVIDERS = [
    { id: 'p1', name: 'Proveedor de Papeles S.A.', taxId: '20100100100', contact: 'Juan Mendoza', insumos: 'Papel Couche, Bond' },
    { id: 'p2', name: 'Tintas Importadas SAC', taxId: '20200200200', contact: 'Rosa Lopez', insumos: 'Tintas CMYK, Barniz' },
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
        
        // [LOG] Auditoría
        log('PROVEEDOR_CREADO', `Se registró ${newProvider.name} (RUC: ${newProvider.taxId})`);
        
        return { success: true };
    },
    async updateProvider(id, updates) {
        let providers = await this.getProviders();
        providers = providers.map(p => p.id === id ? { ...p, ...updates } : p);
        setStorage('admin_providers', providers);
        
        // [LOG] Auditoría
        log('PROVEEDOR_ACTUALIZADO', `Se actualizaron datos del proveedor ID: ${id}`);
        
        return { success: true };
    },
    async deleteProvider(id) {
        let providers = await this.getProviders();
        const provider = providers.find(p => p.id === id);
        providers = providers.filter(p => p.id !== id);
        setStorage('admin_providers', providers);
        
        // [LOG] Auditoría
        log('PROVEEDOR_ELIMINADO', `Se eliminó a ${provider ? provider.name : id}`);
        
        return { success: true };
    },
    async getTotalProviders() {
        const providers = await this.getProviders();
        return providers.length;
    }
};