/**
 * js/controllers/ordenes.controller.js
 * Controlador Actualizado:
 * - Nueva Pestaña "Completadas".
 * - OTs en Proceso separadas de OTs Completadas.
 */
import { OrdenesService } from '../services/ordenes.service.js';

export const OrdenesController = {
    currentTab: 'activas',
    
    init: async function() {
        console.log("OrdenesController (CRM) inicializado.");
        this.setupTabs();
        await this.loadAndRender();
        this.setupEvents();
    },

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Reset visual
                tabButtons.forEach(btn => {
                    btn.classList.remove('tab-active', 'border-red-500', 'text-red-500');
                    btn.classList.add('border-transparent', 'text-gray-500');
                });
                tabContents.forEach(content => content.classList.add('hidden'));

                // Activar actual
                const tabId = e.currentTarget.dataset.tab;
                e.currentTarget.classList.remove('border-transparent', 'text-gray-500');
                e.currentTarget.classList.add('tab-active', 'border-red-500', 'text-red-500');
                document.getElementById(`tab-${tabId}`)?.classList.remove('hidden');
                
                this.currentTab = tabId;
                this.loadAndRender();
            });
        });
        // Click por defecto en la primera pestaña
        const defaultTab = document.querySelector('[data-tab="activas"]');
        if (defaultTab) defaultTab.click();
    },

    async loadAndRender() {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const allOrders = await OrdenesService.getAllOrders();

        // --- CLASIFICACIÓN DE ESTADOS ---
        
        // 1. Estados de Producción Activa (Pestaña: ots)
        // Quitamos 'Completado' de aquí
        const productionStates = [
            'Orden creada', 
            'Diseño Pendiente', 'En diseño', 'En Aprobación de Cliente', 'Diseño Aprobado', 'Cambios Solicitados', 'En Pre-prensa',
            'Asignada a Prensa', 'En Preparación', 'Imprimiendo', 'En proceso', 'En prensa',
            'En Post-Prensa', 'En Acabados', 'En Control de Calidad'
        ];

        let filteredByTab = [];

        if (this.currentTab === 'activas') {
            // Cotizaciones
            filteredByTab = allOrders.filter(o => ['Nueva', 'En Negociación'].includes(o.estado));
            
        } else if (this.currentTab === 'ots') {
            // SOLO en Producción
            filteredByTab = allOrders.filter(o => productionStates.includes(o.estado));
            
        } else if (this.currentTab === 'completadas') {
            // SOLO Completadas (Nueva lógica)
            filteredByTab = allOrders.filter(o => o.estado === 'Completado');
            
        } else if (this.currentTab === 'rechazadas') {
            // Rechazadas
            filteredByTab = allOrders.filter(o => ['Rechazada', 'Cancelada'].includes(o.estado));
        }

        // Filtro de Búsqueda
        const finalData = filteredByTab.filter(o => 
            (o.codigo && o.codigo.toLowerCase().includes(searchTerm)) || 
            (o.cliente_nombre && o.cliente_nombre.toLowerCase().includes(searchTerm)) ||
            (o.ot_id && o.ot_id.toLowerCase().includes(searchTerm))
        );
        
        this.renderTable(finalData);
        this.updatePagination(finalData.length);
    },

    renderTable(orders) {
        const activeTabEl = document.getElementById(`tab-${this.currentTab}`);
        const tbody = activeTabEl?.querySelector('tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (orders.length === 0) {
            const colSpan = (this.currentTab === 'ots' || this.currentTab === 'completadas') ? 6 : 7;
            tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center py-6 text-gray-500">No se encontraron registros en esta sección.</td></tr>`;
            return;
        }

        orders.forEach(order => {
            const productsSummary = order.items ? order.items.map(i => i.producto).join(', ') : 'Sin items';
            const itemsCount = order.items ? order.items.length : 0;
            
            // --- BADGES ---
            let displayEstado = order.estado;
            let badgeClass = 'px-3 py-1 rounded-full text-xs font-bold border border-transparent inline-block'; 
            let badgeStyle = ''; 

            const estadosPreprensa = ['Diseño Pendiente', 'En diseño', 'En Aprobación de Cliente', 'Diseño Aprobado', 'Cambios Solicitados', 'Orden creada'];
            const estadosPrensa = ['Asignada a Prensa', 'En Preparación', 'Imprimiendo', 'En proceso'];
            const estadosPost = ['En Post-Prensa', 'En Acabados', 'En Control de Calidad'];

            if (estadosPreprensa.includes(order.estado)) displayEstado = 'En Pre-prensa';
            else if (estadosPrensa.includes(order.estado)) displayEstado = 'En Prensa';
            else if (estadosPost.includes(order.estado)) displayEstado = 'En Post-Prensa';

            switch (displayEstado) {
                case 'Nueva': case 'En Negociación': badgeClass += ' bg-yellow-100 text-yellow-800'; break;
                case 'En Pre-prensa': badgeStyle = 'background-color: rgba(234, 179, 8, 0.12); color: #EAB308;'; break;
                case 'En Prensa': badgeStyle = 'background-color: rgba(147, 51, 234, 0.12); color: #9333EA;'; break;
                case 'En Post-Prensa': badgeStyle = 'background-color: rgba(22, 163, 74, 0.12); color: #16A34A;'; break;
                case 'Completado': badgeStyle = 'background-color: rgba(30, 58, 138, 0.12); color: #1E3A8A;'; break; // Azul fuerte
                case 'Rechazada': badgeClass += ' bg-red-100 text-red-800'; break;
                default: badgeClass += ' bg-gray-100 text-gray-800';
            }
            
            const styleAttr = badgeStyle ? `style="${badgeStyle}"` : '';
            const badgeHTML = `<span class="${badgeClass}" ${styleAttr}>${displayEstado}</span>`;
            
            // --- ACCIONES ---
            let actionsHTML = '';
            const btnView = `<a href="#/orden-detalle/${order.id}/view" class="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 inline-block mr-1" title="Ver Detalle"><i data-lucide="eye" class="w-5 h-5"></i></a>`;

            // Si estamos en OTs o Completadas, la estructura es similar
            if (this.currentTab === 'ots' || this.currentTab === 'completadas') {
                actionsHTML = btnView;
                // Si está completada y facturada, mostramos check
                if (order.estado_facturacion === 'Facturado') {
                     actionsHTML += `<i data-lucide="check" class="w-4 h-4 text-green-600 inline-block ml-1" title="Facturado"></i>`;
                }
            } else {
                // Cotizaciones activas o rechazadas
                actionsHTML = `
                    <a href="#/orden-detalle/${order.id}/edit" class="text-blue-600 hover:text-blue-800 p-1 inline-block mr-1" title="Editar">
                        <i data-lucide="edit" class="w-5 h-5"></i>
                    </a>
                    ${btnView}
                `;
            }

            const totalVal = order.total ? parseFloat(order.total).toFixed(2) : '0.00';
            let columnsHTML = '';
            
            // Renderizado condicional de columnas
            if (this.currentTab === 'ots' || this.currentTab === 'completadas') {
                // Priorizamos mostrar OT ID
                let displayId = order.ot_id;
                if (!displayId || displayId === 'PENDIENTE') displayId = order.codigo;

                columnsHTML = `
                    <td class="px-6 py-4 text-sm font-bold text-gray-900">${displayId}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${order.cliente_nombre || 'Sin Nombre'}</td>
                    <td class="px-6 py-4 text-sm text-gray-500 truncate max-w-xs" title="${productsSummary}">${itemsCount} línea(s) (${productsSummary})</td>
                    <td class="px-6 py-4 text-sm font-bold text-red-600">S/ ${totalVal}</td>
                    <td class="px-6 py-4 text-sm">${badgeHTML}</td>
                `;
            } else {
                // Cotizaciones
                columnsHTML = `
                    <td class="px-6 py-4 text-sm font-bold text-gray-900">${order.codigo || '-'}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${order.cliente_nombre || 'Sin Nombre'}</td>
                    <td class="px-6 py-4 text-sm text-gray-500 truncate max-w-xs" title="${productsSummary}">${itemsCount} línea(s) (${productsSummary})</td>
                    <td class="px-6 py-4 text-sm font-bold text-red-600">S/ ${totalVal}</td>
                    <td class="px-6 py-4 text-xs text-gray-500">${order.fecha_creacion || '-'}</td>
                    <td class="px-6 py-4 text-sm">${badgeHTML}</td>
                `;
            }

            const row = `<tr class="hover:bg-gray-50 transition">${columnsHTML}<td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">${actionsHTML}</td></tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });

        if (window.lucide) window.lucide.createIcons();
    },

    updatePagination(count) {
        document.getElementById('total-count').textContent = count;
        document.getElementById('start-count').textContent = count > 0 ? 1 : 0;
        document.getElementById('end-count').textContent = count;
    },

    setupEvents() {
        document.getElementById('search-input')?.addEventListener('input', () => this.loadAndRender());
    }
};