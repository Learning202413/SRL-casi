/**
 * js/services/reportes.service.js
 * Servicio para generar datos de reportes de inventario y compras.
 * ACTUALIZADO: Cálculos ABC y Próximos a Agotar.
 */
import { getStorage } from '../../../admin/js/services/local.db.js';

const DB_KEY_ITEMS = 'inv_items';
const DB_KEY_OCS = 'inv_ocs';

export const ReportesService = {
    
    async getInventoryStats() {
        const products = getStorage(DB_KEY_ITEMS, []);
        
        // 1. Items Clase C "Ociosos" (Simulación: Stock > 0 y es Clase C)
        const idleC = products.filter(p => p.abc === 'C' && parseInt(p.stock) > 0).length;

        // 2. Lista de Reposición (Stock <= Minimo)
        const replenishmentList = products
            .filter(p => parseInt(p.stock) <= parseInt(p.min))
            .map(p => ({
                producto: p.nombre,
                sku: p.sku,
                deficit: parseInt(p.min) - parseInt(p.stock),
                unidad: 'Unid.'
            }));

        return { idleC, replenishmentList };
    },

    // NUEVO: Obtener datos para el gráfico ABC
    async getABCStats() {
        const products = getStorage(DB_KEY_ITEMS, []);
        const total = products.length;
        
        if (total === 0) return { a: 0, b: 0, c: 0, total: 0 };

        const counts = {
            A: products.filter(p => p.abc === 'A').length,
            B: products.filter(p => p.abc === 'B').length,
            C: products.filter(p => p.abc === 'C').length
        };

        // Calculamos porcentajes para el gráfico
        return {
            counts,
            percentages: {
                A: ((counts.A / total) * 100).toFixed(1),
                B: ((counts.B / total) * 100).toFixed(1),
                C: ((counts.C / total) * 100).toFixed(1)
            },
            total
        };
    },

    // NUEVO: Obtener ítems "Próximos a Agotar" (Stock > Min pero < 1.5*Min)
    async getNearDepletionItems() {
        const products = getStorage(DB_KEY_ITEMS, []);
        
        return products
            .filter(p => {
                const stock = parseInt(p.stock) || 0;
                const min = parseInt(p.min) || 0;
                // Lógica: Mayor al mínimo (no crítico) PERO menor o igual al 150% del mínimo
                return stock > min && stock <= (min * 1.5);
            })
            .map(p => {
                const stock = parseInt(p.stock);
                const min = parseInt(p.min);
                // Porcentaje de "salud" respecto al mínimo (ej. 110% es apenas 10% sobre el límite)
                const healthPct = ((stock / min) * 100).toFixed(0);
                
                return {
                    nombre: p.nombre,
                    sku: p.sku,
                    stock: stock,
                    min: min,
                    healthPct: healthPct
                };
            });
    },

    async getPurchaseStats() {
        const ocs = getStorage(DB_KEY_OCS, []);
        
        // 1. Frecuencia de Compra (Mes Actual)
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const purchaseFrequency = ocs.filter(oc => {
            const parts = oc.fecha.split(','); 
            if(parts.length > 0) {
                const [day, month, year] = parts[0].trim().split('/');
                return parseInt(month) - 1 === currentMonth && parseInt(year) === currentYear;
            }
            return false;
        }).length;

        // 2. Tiempo de Ciclo de Compra
        const receivedOCs = ocs.filter(oc => oc.estado.includes('Recibida') && oc.fecha_recepcion);
        let totalDays = 0;
        let count = 0;

        receivedOCs.forEach(oc => {
            const parseDate = (str) => {
                const [datePart, timePart] = str.split(',');
                const [day, month, year] = datePart.trim().split('/');
                return new Date(year, month - 1, day);
            };
            try {
                const start = parseDate(oc.fecha);
                const end = parseDate(oc.fecha_recepcion);
                const diffTime = Math.abs(end - start);
                totalDays += Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                count++;
            } catch (e) { console.warn(e); }
        });

        const cycleTime = count > 0 ? (totalDays / count).toFixed(1) : 0;

        return { purchaseFrequency, cycleTime };
    }
};