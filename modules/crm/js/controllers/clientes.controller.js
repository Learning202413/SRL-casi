/**
 * js/controllers/clientes.controller.js
 * Controlador para la vista de lista de clientes.
 * AHORA IMPORTA: ClientesService (Solo para listar y borrar).
 */
import { ClientesService } from '../services/clientes.service.js';

export const ClientesController = {
    currentPage: 1,
    itemsPerPage: 10,

    init: async function() {
        console.log("ClientesController (CRM) inicializado.");
        await this.loadAndRender();
        this.setupEvents();
    },

    async loadAndRender() {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        
        // Llamada al servicio específico de la lista
        const allClients = await ClientesService.getAllClients();

        // Lógica de presentación (Filtrado)
        const filtered = allClients.filter(c => 
            c.razon_social.toLowerCase().includes(searchTerm) || 
            c.ruc.includes(searchTerm) ||
            c.nombre_contacto.toLowerCase().includes(searchTerm)
        );

        const totalItems = filtered.length;
        // const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1; // (Variable no usada por ahora)
        
        this.renderTable(filtered);
        this.updatePaginationInfo(filtered.length, totalItems);
    },

    renderTable(clients) {
        const tbody = document.getElementById('client-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (clients.length === 0) {
            // Ajustado colspan a 6 por la nueva columna
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-gray-500">No se encontraron clientes.</td></tr>';
            return;
        }

        clients.forEach(client => {
            // Lógica para determinar el tipo (Compatible con datos viejos y nuevos)
            // Si no tiene el campo 'tipo_persona', deducimos por el largo del RUC (8 = Natural, 11 = Juridica)
            const isNatural = (client.tipo_persona === 'NATURAL') || (!client.tipo_persona && client.ruc.length === 8);
            
            const tipoLabel = isNatural ? 'Persona' : 'Empresa';
            const tipoClass = isNatural 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800';

            const row = `
                <tr class="hover:bg-gray-50 transition duration-150" data-client-id="${client.id}">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ${client.razon_social}
                    </td>
                    
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tipoClass}">
                            ${tipoLabel}
                        </span>
                    </td>

                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">${client.ruc}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.nombre_contacto}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.email}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                        <a href="#/cliente-detalle/${client.id}" class="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 inline-block" title="Editar">
                            <i data-lucide="edit" class="w-5 h-5"></i>
                        </a>
                        <button class="btn-delete text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100" title="Eliminar" data-client-id="${client.id}" data-client-name="${client.razon_social}">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });

        if (window.lucide) window.lucide.createIcons();
    },

    updatePaginationInfo(currentCount, total) {
        const startCountEl = document.getElementById('start-count');
        const endCountEl = document.getElementById('end-count');
        const totalCountEl = document.getElementById('total-count');

        if(startCountEl) startCountEl.textContent = total > 0 ? 1 : 0;
        if(endCountEl) endCountEl.textContent = currentCount;
        if(totalCountEl) totalCountEl.textContent = total;
    },

    setupEvents() {
        const searchInput = document.getElementById('search-input');
        searchInput?.addEventListener('input', () => {
            this.loadAndRender();
        });

        const tableBody = document.getElementById('client-table-body');
        tableBody?.addEventListener('click', (e) => {
            const deleteButton = e.target.closest('.btn-delete');
            if (deleteButton) {
                const { clientId, clientName } = deleteButton.dataset;
                
                window.UI.showConfirmModal(
                    'Confirmar Eliminación',
                    `¿Estás seguro de que deseas eliminar a "${clientName}"? Esta acción es irreversible.`,
                    'Sí, Eliminar',
                    async () => {
                        // Uso del servicio específico para eliminar
                        await ClientesService.deleteClient(clientId);
                        window.UI.showNotification('Eliminado', 'Cliente eliminado correctamente.');
                        this.loadAndRender();
                    }
                );
            }
        });
    }
};