/**
 * js/controllers/historial.global.controller.js
 * Controlador para la vista de auditoría global.
 * CORREGIDO: Categoría SRM visible para 'ORDEN_COMPRA'.
 */
import { HistorialGlobalService } from '../services/historial.global.service.js';

export const HistorialGlobalController = {
    init: function() {
        console.log("HistorialGlobalController inicializado.");
        
        const filterButton = document.getElementById('filter-button');
        const filterPanel = document.getElementById('filter-panel');
        if (filterButton && filterPanel) {
            filterButton.onclick = () => filterPanel.classList.toggle('hidden');
        }
        
        const dateRangeInput = document.getElementById('filter-date-range');
        if (dateRangeInput && window.flatpickr) {
            window.flatpickr(dateRangeInput, {
                mode: "range", dateFormat: "d/m/Y", locale: "es",
                altInput: true, altFormat: "d/m/Y", position: "auto",
            });
        }

        this.loadLogTable(); 
    },

    async loadLogTable() {
        const logs = await HistorialGlobalService.getLogs();
        const tbody = document.getElementById('log-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-gray-500">No hay registros de auditoría.</td></tr>';
            return;
        }

        const getCategoryBadge = (action) => {
            let label = 'Sistema';
            let color = 'bg-gray-100 text-gray-600';

            if (action.includes('USUARIO')) {
                label = 'Admin / RRHH';
                color = 'bg-purple-100 text-purple-800';
            } 
            // DETECCIÓN ESPECÍFICA PARA OC
            
            else if (action.includes('PROVEEDOR') ) {
                label = 'Admin / RRHH';
                color = 'bg-purple-100 text-purple-800';
            } 
            else if (action.includes('PRODUCTO') || action.includes('STOCK') || action.includes('RECEPCION') || action.includes('ORDEN_COMPRA')) {
                label = 'Inventario';
                color = 'bg-orange-100 text-orange-800';
            } 
            else if (action.includes('ORDEN') || action.includes('COTIZACION') || action.includes('OT_') || action.includes('DISENO')) {
                label = 'Producción';
                color = 'bg-blue-100 text-blue-800';
            }

            return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${color}">${label}</span>`;
        };

        logs.slice(0, 20).forEach(log => { 
            const row = `
                <tr class="hover:bg-gray-50 border-b last:border-0 transition group">
                    <td class="px-6 py-4 text-sm font-bold text-gray-900">
                        <div class="flex items-center">
                            <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3 text-gray-500">
                                <i data-lucide="user" class="w-4 h-4"></i>
                            </div>
                            ${log.user || 'Sistema'}
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm font-mono text-gray-500">${log.timestamp}</td>
                    <td class="px-6 py-4">
                        ${getCategoryBadge(log.action)}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-700">
                        <span class="font-bold text-gray-900 block mb-1">${log.action}</span> 
                        <span class="text-gray-500 text-xs">${log.details}</span>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });

        if(window.lucide) window.lucide.createIcons();
    }
};