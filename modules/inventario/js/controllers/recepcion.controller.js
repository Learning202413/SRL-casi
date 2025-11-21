/**
 * js/controllers/recepcion.controller.js
 * Controlador para la recepción de mercancía.
 * CORRECCIÓN: Solución al problema de múltiples listeners que causaba sumas duplicadas de stock.
 */
import { RecepcionService } from '../services/recepcion.service.js';

export const RecepcionController = {
    currentOC: null,
    
    // Referencia para controlar el evento y evitar duplicados
    _boundHandleReceiveSubmit: null,

    init: async function() {
        console.log("RecepcionController inicializado.");
        await this.loadTable();
        this.setupEvents();
    },

    async loadTable() {
        const ocs = await RecepcionService.getPendingOCs();
        const tbody = document.getElementById('oc-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (ocs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-gray-500">No hay OCs pendientes de recepción.</td></tr>';
            return;
        }

        ocs.forEach(oc => {
            const row = `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4 text-sm font-mono text-gray-700">${oc.id}</td>
                    <td class="px-6 py-4 text-sm font-bold text-gray-900">${oc.proveedor_nombre}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${oc.fecha}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">Pendiente</td>
                    <td class="px-6 py-4 text-sm"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">${oc.estado}</span></td>
                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button class="btn-receive flex items-center justify-center mx-auto px-3 py-1 text-sm color-primary-red text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 transition" data-id="${oc.id}">
                            <i data-lucide="package-check" class="w-4 h-4 mr-1"></i> Recibir Mercancía
                        </button>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        if(window.lucide) window.lucide.createIcons();
    },

    renderModalItemsInContainer(oc) {
        const container = document.getElementById('receive-modal-container');
        if (!container) return;

        const title = container.querySelector('h3');
        const tbody = container.querySelector('tbody');

        if (title) title.textContent = `Recibir Mercancía: ${oc.id}`;
        
        if (tbody) {
            tbody.innerHTML = '';
            oc.items.forEach(item => {
                const row = `
                    <tr>
                        <td class="px-4 py-3 font-medium text-gray-800 item-name">${item.producto}</td>
                        <td class="px-4 py-3 text-gray-700">${item.cantidad}</td>
                        <td class="px-4 py-3">
                            <input type="number" value="${item.cantidad}" max="${item.cantidad}" min="0" class="form-input w-24 p-2 border border-gray-300 rounded-lg item-qty">
                        </td>
                    </tr>
                `;
                tbody.insertAdjacentHTML('beforeend', row);
            });
        }
    },

    // Función manejadora separada para poder referenciarla y removerla
    async handleReceiveSubmit(e) {
        if (e.target.id === 'receive-form') {
            e.preventDefault();
            
            const form = e.target;
            const itemsReceived = [];
            const rows = form.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                itemsReceived.push({
                    producto: row.querySelector('.item-name').textContent,
                    cantidad: row.querySelector('.item-qty').value
                });
            });
            
            const comments = form.querySelector('textarea').value;

            // Ejecutar recepción (una sola vez)
            await RecepcionService.receiveOC(this.currentOC.id, itemsReceived, comments);
            
            window.UI.hideModal('receive-modal-container');
            window.UI.showNotification('Recepción Exitosa', 'Stock actualizado correctamente.');
            
            this.loadTable();
        }
    },

    setupEvents() {
        // 1. Tabla (Delegación segura, no se acumula porque la tabla se redibuja)
        const tableBody = document.getElementById('oc-table-body');
        // Clonar el nodo para eliminar listeners previos anónimos si existieran
        const newTableBody = tableBody.cloneNode(true);
        tableBody.parentNode.replaceChild(newTableBody, tableBody);

        newTableBody.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-receive');
            if (btn) {
                const ocId = btn.dataset.id;
                this.currentOC = await RecepcionService.getOCById(ocId);
                
                if(this.currentOC) {
                    window.UI.showModal('receive-modal-container', 'receive-modal-content');
                    setTimeout(() => {
                        this.renderModalItemsInContainer(this.currentOC);
                    }, 50);
                }
            }
        });

        // 2. Modal (Contenedor Estático - REQUIERE LIMPIEZA)
        const modalContainer = document.getElementById('receive-modal-container');
        if (modalContainer) {
            // Preparar la función vinculada (bound) solo una vez
            if (!this._boundHandleReceiveSubmit) {
                this._boundHandleReceiveSubmit = this.handleReceiveSubmit.bind(this);
            }

            // IMPORTANTE: Remover cualquier listener previo antes de agregar uno nuevo
            modalContainer.removeEventListener('submit', this._boundHandleReceiveSubmit);
            modalContainer.addEventListener('submit', this._boundHandleReceiveSubmit);
        }
    }
};