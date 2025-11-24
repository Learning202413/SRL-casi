/**
 * js/services/stock.service.js
 * Servicio para gestionar datos de inventario.
 */
import { getStorage, setStorage, log } from '../../../admin/js/services/local.db.js'; 
import { providersDB } from '../../../admin/js/services/providers.db.js';

const DB_KEY_ITEMS = 'inv_items';
const DB_KEY_OCS = 'inv_ocs';

const SEED_ITEMS = [
    { sku: 'PAP-COU-150', nombre: 'Papel Couche 150gr', stock: 1200, min: 1000, categoria: 'Papel', abc: 'A', precio: 150.00 },
    { sku: 'TIN-CMYK-01', nombre: 'Tinta Offset (CMYK)', stock: 50, min: 100, categoria: 'Tintas', abc: 'A', precio: 45.50 },
    { sku: 'PLA-CTP-001', nombre: 'Planchas CTP', stock: 20, min: 15, categoria: 'Placas', abc: 'B', precio: 25.00 }
];

export const StockService = {
    async getProducts() {
        return getStorage(DB_KEY_ITEMS, SEED_ITEMS);
    },

    async getProductBySku(sku) {
        const items = await this.getProducts();
        return items.find(i => i.sku === sku);
    },

    async addProduct(product) {
        const items = await this.getProducts();
        
        if (!product.sku || product.sku === '[Generado automáticamente]') {
            const catCode = product.categoria ? product.categoria.substring(0, 3).toUpperCase() : 'GEN';
            const rnd = Math.floor(Math.random() * 10000);
            product.sku = `${catCode}-${rnd}`;
        }
        
        items.push(product);
        setStorage(DB_KEY_ITEMS, items);
        
        log('PRODUCTO_CREADO', `Se creó el insumo: ${product.nombre} (SKU: ${product.sku})`);
        
        return { success: true };
    },

    async updateProduct(originalSku, updates) {
        let items = await this.getProducts();
        const index = items.findIndex(i => i.sku === originalSku);
        
        if (index === -1) return { success: false, message: 'Producto no encontrado' };

        items[index] = { ...items[index], ...updates, sku: originalSku };
        setStorage(DB_KEY_ITEMS, items);
        
        log('PRODUCTO_EDITADO', `Se modificó la ficha del insumo SKU: ${originalSku}`);
        
        return { success: true };
    },

    async deleteProduct(sku) {
        let items = await this.getProducts();
        const initialLength = items.length;
        const product = items.find(i => i.sku === sku);
        items = items.filter(i => i.sku !== sku);
        
        if (items.length === initialLength) return { success: false };
        
        setStorage(DB_KEY_ITEMS, items);
        log('PRODUCTO_ELIMINADO', `Se eliminó el insumo: ${product ? product.nombre : sku}`);
        
        return { success: true };
    },

    // --- PROVEEDORES Y CATEGORÍAS ---
    
    async getProviderCategories() {
        if (!providersDB) return [];
        const providers = await providersDB.getProviders();
        const categories = new Set();
        providers.forEach(p => {
            if (p.insumos) p.insumos.split(',').forEach(i => categories.add(i.trim()));
        });
        return Array.from(categories).sort();
    },

    async searchProviders(query) {
        if (!providersDB) return [];
        const providers = await providersDB.getProviders();
        if (!query) return providers;
        const lowerQ = query.toLowerCase();
        return providers.filter(p => 
            (p.name && p.name.toLowerCase().includes(lowerQ)) || 
            (p.taxId && p.taxId.includes(lowerQ))
        );
    },

    // --- LÓGICA MODIFICADA PARA MULTIPLES PROVEEDORES ---
    async getProductsForProvider(providerId, query) {
        if (!providerId) return [];
        
        const allProducts = await this.getProducts();

        // FILTRO INTELIGENTE: 
        // Verifica si el ID está en el array 'proveedores' O si coincide con el antiguo 'proveedor_id'
        let filtered = allProducts.filter(prod => {
            const hasInArray = prod.proveedores && Array.isArray(prod.proveedores) && prod.proveedores.some(p => p.id === providerId);
            const hasInLegacy = prod.proveedor_id === providerId;
            return hasInArray || hasInLegacy;
        });

        // Si hay texto en el buscador, filtramos por nombre o SKU
        if (query) {
            const lowerQ = query.toLowerCase();
            filtered = filtered.filter(p => 
                p.nombre.toLowerCase().includes(lowerQ) || 
                p.sku.toLowerCase().includes(lowerQ)
            );
        }

        return filtered;
    },

    async createOC(ocData) {
        const ocs = getStorage(DB_KEY_OCS, []);
        const newOC = {
            ...ocData,
            id: `OC-${new Date().getFullYear()}-${String(ocs.length + 1).padStart(3, '0')}`,
            fecha: new Date().toLocaleString(),
            estado: 'Enviada'
        };
        ocs.push(newOC);
        setStorage(DB_KEY_OCS, ocs);
        
        log('ORDEN_COMPRA_CREADA', `Se generó la ${newOC.id} para ${newOC.proveedor_nombre}`);
        
        return { success: true, code: newOC.id };
    }
};