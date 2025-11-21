/**
 * js/controllers/facturacion.controller.js
 * Controlador: Lista documentos fiscales generados.
 */
import { FacturacionService } from '../services/facturacion.service.js';

export const FacturacionController = {
    init: async function() {
        console.log("FacturacionController Inicializado.");
        this.setupEvents();
        await this.loadAndRender();
    },

    setupEvents() {
        const filterButton = document.getElementById('filter-button');
        const filterPanel = document.getElementById('filter-panel');
        if (filterButton && filterPanel) {
            filterButton.onclick = () => filterPanel.classList.toggle('hidden');
        }
        document.getElementById('search-input')?.addEventListener('input', () => this.loadAndRender());
    },

    async loadAndRender() {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const docs = await FacturacionService.getAllDocuments();

        const filtered = docs.filter(d => 
            d.numero.toLowerCase().includes(searchTerm) ||
            d.cliente_nombre.toLowerCase().includes(searchTerm) ||
            d.ot_id.toLowerCase().includes(searchTerm)
        );

        this.renderTable(filtered);
        this.updatePagination(filtered.length);
    },

    renderTable(documents) {
        const tbody = document.getElementById('documents-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (documents.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-gray-500">No hay documentos fiscales emitidos aún.</td></tr>`;
            return;
        }

        documents.forEach(doc => {
            const typeClass = doc.tipo === 'FACTURA' ? 'text-blue-600' : 'text-indigo-600';
            const typeLabel = doc.tipo === 'FACTURA' ? 'Factura Elec.' : 'Boleta Elec.';

            const row = `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4 text-sm font-bold ${typeClass}">${typeLabel}</td>
                    <td class="px-6 py-4 text-sm text-gray-900 font-mono">${doc.numero}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">
                        <div class="font-medium">${doc.cliente_nombre}</div>
                        <div class="text-xs text-gray-400">Doc: ${doc.cliente_doc}</div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">${doc.ot_id}</td>
                    <td class="px-6 py-4 text-xs text-gray-500">${doc.fecha_emision}</td>
                    <td class="px-6 py-4 text-sm font-bold text-right text-gray-800">S/ ${doc.total}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button onclick="alert('Descargando PDF para ${doc.numero}...')" class="text-red-600 hover:text-red-800 transition p-1 rounded-full hover:bg-red-50" title="Descargar PDF">
                            <i data-lucide="file-down" class="w-5 h-5"></i>
                        </button>
                        <button onclick="alert('Enviando XML a SUNAT...')" class="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100 ml-2" title="Ver XML">
                            <i data-lucide="code" class="w-5 h-5"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });

        if (window.lucide) window.lucide.createIcons();
    },

    updatePagination(count) {
        document.getElementById('total-count').textContent = count;
        document.getElementById('start-count').textContent = count > 0 ? 1 : 0;
        document.getElementById('end-count').textContent = count;
    }
};