// Importa el nuevo servicio de usuarios
import { usersDB } from '../services/users.db.js';

export const UsuariosController = {
    // Estado de paginación
    currentPage: 1,
    itemsPerPage: 10,
    
    // Estado de ordenamiento: Por defecto, ordenar por nombre ascendente
    sortState: { 
        key: 'name', 
        direction: 'asc' 
    },

    init: async function() {
        console.log("UsuariosController: Iniciando con BD de Usuarios...");
        await this.applyFilters();
        this.setupEvents();
        this.setupSortEvents(); 
    },

    // --- LÓGICA DE ORDENAMIENTO ---
    sortUsers(users, key, direction) {
        const isNumeric = ['id'].includes(key); 
        
        users.sort((a, b) => {
            let valA = a[key] || (isNumeric ? 0 : '');
            let valB = b[key] || (isNumeric ? 0 : '');

            if (!isNumeric && typeof valA === 'string' && typeof valB === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            let comparison = 0;
            if (valA > valB) comparison = 1;
            else if (valA < valB) comparison = -1;

            return direction === 'asc' ? comparison : comparison * -1;
        });
        
        return users;
    },

    async applyFilters() {
        const searchTerm = document.getElementById('search-user-input')?.value.toLowerCase() || '';
        const roleFilter = document.getElementById('filter-role')?.value || '';
        const statusFilter = document.getElementById('filter-status')?.value || '';

        const users = await usersDB.getUsers(); 

        const filteredUsers = users.filter(user => {
            const matchesSearch = (user.name && user.name.toLowerCase().includes(searchTerm)) || 
                                  (user.email && user.email.toLowerCase().includes(searchTerm));
            const matchesRole = roleFilter ? user.role === roleFilter : true;
            const matchesStatus = statusFilter ? user.status === statusFilter : true;
            return matchesSearch && matchesRole && matchesStatus;
        });

        const sortedUsers = this.sortUsers(filteredUsers, this.sortState.key, this.sortState.direction);

        const totalItems = sortedUsers.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);

        if (this.currentPage > totalPages && totalPages > 0) this.currentPage = totalPages;
        if (this.currentPage < 1) this.currentPage = 1;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

        this.renderTable(paginatedUsers);
        this.renderPagination(totalItems, startIndex + 1, Math.min(endIndex, totalItems), totalPages);
    },

    renderTable(users) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">No se encontraron usuarios.</td></tr>';
            return;
        }
        
        const sortKey = this.sortState.key;
        const sortDir = this.sortState.direction;
        
        const getSortIcon = (key) => {
            if (sortKey === key) {
                return `<i data-lucide="${sortDir === 'asc' ? 'arrow-down-narrow-wide' : 'arrow-up-narrow-wide'}" class="w-4 h-4 mr-1"></i>`;
            }
            return '';
        };

        const thead = document.querySelector('.table-header-bg tr');
        if (thead) {
            thead.innerHTML = `
                <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer" data-sort-key="name">
                    <div class="flex items-center justify-start">${getSortIcon('name')}Nombre Completo</div>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer" data-sort-key="email">
                    <div class="flex items-center justify-start">${getSortIcon('email')}Email</div>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer" data-sort-key="role">
                    <div class="flex items-center justify-start">${getSortIcon('role')}Rol Asignado</div>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer" data-sort-key="status">
                    <div class="flex items-center justify-start">${getSortIcon('status')}Estado (Presence)</div>
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Acciones</th>
            `;
        }

        users.forEach(user => {
            const isOnline = user.status === 'Online';
            const statusColor = isOnline ? 'text-green-600' : 'text-gray-500';
            const dotColor = isOnline ? 'bg-green-500' : 'bg-gray-400';

            const row = `
                <tr class="hover:bg-gray-50 group transition-colors duration-150">
                    <td class="px-6 py-4 font-bold text-gray-900">${user.name || 'Sin Nombre'}</td>
                    <td class="px-6 py-4 text-gray-500">${user.email || 'Sin Email'}</td>
                    <td class="px-6 py-4 text-gray-700">${user.role || 'Sin Rol'}</td>
                    <td class="px-6 py-4">
                        <span class="flex items-center text-xs font-bold ${statusColor}">
                            <span class="w-2 h-2 rounded-full mr-2 ${dotColor}"></span>
                            ${user.status || 'Offline'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-center space-x-2">
                        <button class="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition btn-edit" data-id="${user.id}">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button class="text-red-600 hover:bg-red-100 p-2 rounded-lg transition btn-delete" data-id="${user.id}" data-name="${user.name}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        
        if(window.lucide) window.lucide.createIcons();
    },

    renderPagination(totalItems, startItem, endItem, totalPages) {
        const container = document.getElementById('pagination-controls');
        if (!container) return;

        if (totalItems === 0) {
            container.innerHTML = '<span class="text-sm text-gray-500">No se encontraron resultados.</span>';
            return;
        }

        container.innerHTML = `
            <div class="text-sm text-gray-600">
                Mostrando <span class="font-bold text-gray-900">${startItem}</span> a <span class="font-bold text-gray-900">${endItem}</span> de <span class="font-bold text-gray-900">${totalItems}</span> usuarios
            </div>
            <div class="flex space-x-2">
                <button id="btn-prev-page" class="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                </button>
                <span class="px-3 py-1 text-sm font-medium text-gray-700">Página ${this.currentPage}</span>
                <button id="btn-next-page" class="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" ${this.currentPage >= totalPages ? 'disabled' : ''}>
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        
        if(window.lucide) window.lucide.createIcons();

        document.getElementById('btn-prev-page')?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.applyFilters();
            }
        });

        document.getElementById('btn-next-page')?.addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.applyFilters();
            }
        });
    },
    
    setupSortEvents() {
        document.querySelector('.table-header-bg')?.addEventListener('click', (e) => {
            const th = e.target.closest('th');
            const key = th?.dataset.sortKey;

            if (key) {
                if (this.sortState.key === key) {
                    this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortState.key = key;
                    this.sortState.direction = 'asc';
                }
                
                this.currentPage = 1;
                this.applyFilters();
            }
        });
    },

    setupEvents() {
        const resetPageAndFilter = () => {
            this.currentPage = 1;
            this.applyFilters();
        };

        document.getElementById('search-user-input')?.addEventListener('input', resetPageAndFilter);
        document.getElementById('filter-role')?.addEventListener('change', resetPageAndFilter);
        document.getElementById('filter-status')?.addEventListener('change', resetPageAndFilter);

        document.getElementById('btn-create-user')?.addEventListener('click', () => {
            const form = document.getElementById('user-create-form');
            if(form) form.reset();
            window.UI.showModal('user-modal-container', 'user-create-modal-content');
        });

        document.getElementById('user-modal-container')?.addEventListener('submit', async (e) => {
            
            // CREAR (ACTUALIZADO CON MANEJO DE ERRORES)
            if (e.target.id === 'user-create-form') {
                e.preventDefault();
                const form = e.target; 
                
                const newUser = {
                    name: form.querySelector('#user-create-name').value,
                    email: form.querySelector('#user-create-email').value,
                    role: form.querySelector('#user-create-role').value,
                    status: 'Offline'
                };

                if (!newUser.name || !newUser.email) {
                    window.UI.showNotification('Error', 'El nombre y el email son obligatorios.');
                    return;
                }

                const result = await usersDB.addUser(newUser); 

                if (result.success) {
                    window.UI.hideModal('user-modal-container');
                    window.UI.showNotification('Éxito', 'Usuario creado correctamente.');
                    
                    document.getElementById('search-user-input').value = '';
                    this.currentPage = 1; 
                    this.applyFilters();
                } else {
                    // Mostrar el mensaje de error del servicio (ej: Email duplicado)
                    window.UI.showNotification('Error', result.message);
                }
            }

            // EDITAR
            if (e.target.id === 'user-edit-form') {
                e.preventDefault();
                const form = e.target;
                const id = form.querySelector('#user-edit-id-field').value;
                
                const updates = {
                    name: form.querySelector('#user-edit-name').value,
                    email: form.querySelector('#user-edit-email').value,
                    role: form.querySelector('#user-edit-role').value,
                };

                await usersDB.updateUser(id, updates);
                window.UI.hideModal('user-modal-container');
                window.UI.showNotification('Actualizado', 'Datos modificados.');
                
                this.applyFilters();
            }
        });

        const tbody = document.getElementById('users-table-body');
        tbody?.addEventListener('click', async (e) => {
            const btnDelete = e.target.closest('.btn-delete');
            if (btnDelete) {
                const id = btnDelete.dataset.id;
                const name = btnDelete.dataset.name;
                window.UI.showConfirmModal('Eliminar Usuario', `¿Eliminar a ${name}?`, 'Sí, eliminar', async () => {
                    await usersDB.deleteUser(id); 
                    this.applyFilters(); 
                });
            }
            
            const btnEdit = e.target.closest('.btn-edit');
            if (btnEdit) {
                const id = btnEdit.dataset.id;
                const users = await usersDB.getUsers(); 
                const user = users.find(u => u.id === id);
                if (user) {
                    window.UI.showModal('user-modal-container', 'user-edit-modal-content');
                    const container = document.getElementById('user-modal-container');
                    if(container) {
                        container.querySelector('#user-edit-id-field').value = user.id;
                        container.querySelector('#user-edit-name').value = user.name;
                        container.querySelector('#user-edit-email').value = user.email;
                        container.querySelector('#user-edit-role').value = user.role;
                    }
                }
            }
        });
    }
};