/**
 * js/controllers/produccion.controller.js
 * Controlador de Control de Producción (Admin).
 * Lógica de separación de vistas y flujo de estados.
 */
import { productionDB } from '../services/production.db.js'; 
import { usersDB } from '../services/users.db.js'; 

export const ProductionController = {
    _submitHandler: null,

    init: async function() {
        console.log("ProductionController: Iniciando...");
        this.setupTabs();
        await this.loadOTs();
        this.setupListAssignButtons();
        this.setupModalEvents();
    },

    setupTabs() {
        const tabUnassigned = document.getElementById('tab-unassigned');
        const tabAssigned = document.getElementById('tab-assigned');
        
        if (!tabUnassigned || !tabAssigned) return;

        const switchTab = (view) => {
            if (view === 'unassigned') {
                tabUnassigned.className = "px-4 py-2 text-sm font-bold text-red-700 bg-white rounded-md shadow-sm transition";
                tabAssigned.className = "px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md transition";
                document.getElementById('view-unassigned').classList.remove('hidden');
                document.getElementById('view-assigned').classList.add('hidden');
            } else {
                tabAssigned.className = "px-4 py-2 text-sm font-bold text-blue-700 bg-white rounded-md shadow-sm transition";
                tabUnassigned.className = "px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md transition";
                document.getElementById('view-assigned').classList.remove('hidden');
                document.getElementById('view-unassigned').classList.add('hidden');
            }
            this.loadOTs(); // Recargar datos al cambiar
        };

        tabUnassigned.addEventListener('click', () => switchTab('unassigned'));
        tabAssigned.addEventListener('click', () => switchTab('assigned'));
    },

    async loadOTs() {
        try {
            const allOTs = await productionDB.getOTs();
            const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';

            const unassignedList = [];
            const assignedList = [];

            allOTs.forEach(ot => {
                // OTs completadas desaparecen de esta vista
                if (ot.estado === 'Completado') return;

                const s = (ot.estado || '').toLowerCase();
                
                // Filtro de búsqueda
                const matchesSearch = (
                    (ot.ot_id && ot.ot_id.toLowerCase().includes(searchTerm)) ||
                    (ot.cliente_nombre && ot.cliente_nombre.toLowerCase().includes(searchTerm))
                );
                if (!matchesSearch) return;

                // --- LÓGICA DE CLASIFICACIÓN ---
                
                let needsAssignment = false;
                let currentAssignee = null;
                let nextRoleNeeded = '';

                // 1. FASE PRE-PRENSA
                if (s === 'orden creada' || s.includes('diseño pendiente')) {
                    if (!ot.asignado_a) {
                        needsAssignment = true;
                        nextRoleNeeded = 'Diseñador';
                    } else {
                        currentAssignee = ot.asignado_nombre_preprensa;
                    }
                }
                // 2. FASE PRENSA (Viene de Pre-Prensa)
                else if (s === 'en prensa' || s === 'listo para prensa' || s === 'asignada a prensa') {
                    if (!ot.asignado_prensa) {
                        needsAssignment = true;
                        nextRoleNeeded = 'Operador Prensa';
                    } else {
                        currentAssignee = ot.asignado_nombre_prensa;
                    }
                }
                // 3. FASE POST-PRENSA (Viene de Prensa)
                else if (s === 'en post-prensa' || s === 'pendiente' || s.includes('acabados')) {
                    if (!ot.asignado_postprensa) {
                        needsAssignment = true;
                        nextRoleNeeded = 'Operador Acabados';
                    } else {
                        currentAssignee = ot.asignado_nombre_postprensa;
                    }
                }
                // Estados intermedios (En proceso, etc.) se asumen asignados
                else {
                    if (ot.asignado_nombre_postprensa) currentAssignee = ot.asignado_nombre_postprensa;
                    else if (ot.asignado_nombre_prensa) currentAssignee = ot.asignado_nombre_prensa;
                    else if (ot.asignado_nombre_preprensa) currentAssignee = ot.asignado_nombre_preprensa;
                }

                // Distribuir a las listas
                if (needsAssignment) {
                    ot.roleNeeded = nextRoleNeeded;
                    unassignedList.push(ot);
                } else {
                    ot.assigneeDisplay = currentAssignee || 'En Proceso';
                    assignedList.push(ot);
                }
            });

            this.renderUnassigned(unassignedList);
            this.renderAssigned(assignedList);

        } catch (error) {
            console.error("Error cargando OTs:", error);
        }
    },

    renderUnassigned(list) {
        const tbody = document.getElementById('table-body-unassigned');
        const empty = document.getElementById('empty-unassigned');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (list.length === 0) {
            empty.classList.remove('hidden');
        } else {
            empty.classList.add('hidden');
            list.forEach(ot => {
                const prod = (ot.items && ot.items[0]) ? ot.items[0].producto : 'Varios';
                const row = `
                    <tr class="hover:bg-red-50 border-b transition" data-ot-id="${ot.id}">
                        <td class="px-6 py-4 font-bold text-gray-900">${ot.ot_id}</td>
                        <td class="px-6 py-4 text-gray-600">${ot.cliente_nombre}</td>
                        <td class="px-6 py-4 text-gray-600">${prod}</td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold border border-red-200">
                                ${ot.estado}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm font-medium text-gray-700">
                             <i data-lucide="user-plus" class="w-3 h-3 inline mr-1"></i> ${ot.roleNeeded}
                        </td>
                        <td class="px-6 py-4 text-center">
                            <button class="btn-assign px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-red-700 transition">
                                Asignar
                            </button>
                        </td>
                    </tr>
                `;
                tbody.insertAdjacentHTML('beforeend', row);
            });
        }
    },

    renderAssigned(list) {
        const tbody = document.getElementById('table-body-assigned');
        const empty = document.getElementById('empty-assigned');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (list.length === 0) {
            empty.classList.remove('hidden');
        } else {
            empty.classList.add('hidden');
            list.forEach(ot => {
                const prod = (ot.items && ot.items[0]) ? ot.items[0].producto : 'Varios';
                const row = `
                    <tr class="hover:bg-blue-50 border-b transition" data-ot-id="${ot.id}">
                        <td class="px-6 py-4 font-bold text-gray-900">${ot.ot_id}</td>
                        <td class="px-6 py-4 text-gray-600">${ot.cliente_nombre}</td>
                        <td class="px-6 py-4 text-gray-600">${prod}</td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                                ${ot.estado}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm font-medium text-blue-700">
                            <i data-lucide="user" class="w-3 h-3 inline mr-1"></i>${ot.assigneeDisplay}
                        </td>
                        <td class="px-6 py-4 text-center">
                            <button class="btn-assign px-3 py-1 border border-gray-300 text-gray-600 text-sm rounded hover:bg-white hover:text-blue-600 transition" title="Reasignar">
                                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                            </button>
                        </td>
                    </tr>
                `;
                tbody.insertAdjacentHTML('beforeend', row);
            });
        }
        if (window.lucide) window.lucide.createIcons();
    },

    setupListAssignButtons() {
        const handleAssign = (e) => {
            const btn = e.target.closest('.btn-assign');
            if (btn) {
                const row = btn.closest('tr');
                const otId = row.dataset.otId;
                productionDB.getOTs().then(all => {
                    const ot = all.find(o => o.id == otId || o.ot_id == otId);
                    if (ot) this.openAssignModal(ot);
                });
            }
        };
        document.getElementById('table-body-unassigned')?.addEventListener('click', handleAssign);
        document.getElementById('table-body-assigned')?.addEventListener('click', handleAssign);
        
        document.getElementById('search-input')?.addEventListener('input', () => this.loadOTs());
    },

    getModalElement(selector) {
        const container = document.getElementById('assign-modal-container');
        return container ? container.querySelector(selector) : null;
    },

    async openAssignModal(ot) {
        let roleToAssign = 'Diseñador (Pre-Prensa)';
        const s = (ot.estado || '').toLowerCase();

        if (s.includes('post') || s.includes('acabados') || s === 'pendiente') roleToAssign = 'Operador (Post-Prensa)';
        else if (s.includes('prensa')) roleToAssign = 'Operador (Prensa)';
        else roleToAssign = 'Diseñador (Pre-Prensa)';

        window.UI.showModal('assign-modal-container', 'assign-modal-content');

        setTimeout(() => {
            const title = this.getModalElement('#assign-modal-title');
            const label = this.getModalElement('#assign-role-label');
            const otInput = this.getModalElement('#assign-ot-id');
            const resourceInput = this.getModalElement('#assign-resource-id');
            const searchInput = this.getModalElement('#assign-search-input');
            const confirmBtn = this.getModalElement('#confirm-assign-button');

            if(title) title.textContent = `Asignar ${ot.ot_id}`;
            if(label) label.innerHTML = `Rol sugerido: <strong>${roleToAssign}</strong>`;
            if(otInput) otInput.value = ot.id;
            
            if(searchInput) {
                searchInput.value = '';
                searchInput.placeholder = `Buscar ${roleToAssign.split(' ')[0]}...`;
                searchInput.focus();
                // Evitar listeners duplicados
                const newSearch = searchInput.cloneNode(true);
                searchInput.parentNode.replaceChild(newSearch, searchInput);
                newSearch.addEventListener('input', (e) => {
                    if(confirmBtn) confirmBtn.disabled = true;
                    this.renderSuggestions(roleToAssign, e.target.value);
                });
            }
            
            if(resourceInput) resourceInput.value = '';
            if(confirmBtn) confirmBtn.disabled = true;

            this.renderSuggestions(roleToAssign);
        }, 50);
    },

    async renderSuggestions(roleFilter, searchTerm = '') {
        const listEl = this.getModalElement('#assign-suggestions-list');
        if (!listEl) return;
        
        let users = await usersDB.getUsers();
        const roleKey = roleFilter.split(' ')[0]; 

        users = users.filter(u => {
            const roleMatch = u.role === roleFilter || u.role.startsWith(roleKey);
            const nameMatch = !searchTerm || u.name.toLowerCase().includes(searchTerm.toLowerCase());
            // Filtro estricto para evitar cruces entre Prensa y Post-Prensa
            if (roleFilter.includes('Post') && u.role.includes('Prensa') && !u.role.includes('Post')) return false;
            if (roleFilter.includes('Prensa') && !roleFilter.includes('Post') && u.role.includes('Post')) return false;
            return roleMatch && nameMatch;
        });

        listEl.innerHTML = '';
        if (users.length === 0) {
            listEl.innerHTML = '<p class="p-3 text-sm text-gray-400">No se encontraron usuarios.</p>';
            return;
        }

        users.forEach(u => {
            const div = document.createElement('div');
            div.className = "p-3 hover:bg-red-50 cursor-pointer border-b flex justify-between items-center group";
            div.innerHTML = `
                <div>
                    <div class="font-bold text-gray-800 group-hover:text-red-700">${u.name}</div>
                    <div class="text-xs text-gray-500">${u.role}</div>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-gray-300"></i>
            `;
            div.onclick = () => {
                this.getModalElement('#assign-resource-id').value = u.id;
                this.getModalElement('#assign-search-input').value = u.name;
                this.getModalElement('#confirm-assign-button').disabled = false;
                listEl.querySelectorAll('div').forEach(d => d.classList.remove('bg-red-100'));
                div.classList.add('bg-red-100');
            };
            listEl.appendChild(div);
        });
        if(window.lucide) window.lucide.createIcons();
    },

    setupModalEvents() {
        const modalContainer = document.getElementById('assign-modal-container');
        if (modalContainer) {
            if(this._submitHandler) modalContainer.removeEventListener('submit', this._submitHandler);
            
            this._submitHandler = async (e) => {
                if (e.target.id === 'assign-form') {
                    e.preventDefault();
                    const otId = this.getModalElement('#assign-ot-id').value;
                    const userId = this.getModalElement('#assign-resource-id').value;
                    const userName = this.getModalElement('#assign-search-input').value;
                    
                    if (!userId) return;

                    const allUsers = await usersDB.getUsers();
                    const selectedUser = allUsers.find(u => u.id === userId);
                    let newStatus = 'Asignado';
                    
                    if (selectedUser.role.includes('Diseñador')) newStatus = 'Diseño Pendiente';
                    else if (selectedUser.role.includes('Prensa')) newStatus = 'Asignada a Prensa';
                    else if (selectedUser.role.includes('Post')) newStatus = 'Pendiente'; 

                    await productionDB.assignOT(otId, userId, userName, newStatus);
                    
                    window.UI.hideModal('assign-modal-container');
                    window.UI.showNotification('Asignado', `Tarea enviada a ${userName}`);
                    this.loadOTs();
                }
            };
            modalContainer.addEventListener('submit', this._submitHandler);
        }
    }
};