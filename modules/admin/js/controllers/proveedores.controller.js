// Importa el nuevo servicio de proveedores
import { providersDB } from '../services/providers.db.js';

// Token de la API (Definido localmente para no depender de otros servicios)
const API_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImNqYXp6dGluN0BnbWFpbC5jb20ifQ.5NcXq2oQNzTUSEHiGwzZvCqY57fktdSPdBx9kjkXw8k';

export const ProveedoresController = {
    // --- ESTADO DE LA TABLA ---
    currentPage: 1,
    itemsPerPage: 10,
    sortState: { 
        key: 'name',
        direction: 'asc' 
    },

    // Referencias para limpieza de eventos
    _submitHandler: null,
    _clickHandler: null,

    // Almacén temporal para datos fiscales extra (Dirección, Ubigeo, etc.)
    tempCreateFiscalData: {},
    tempEditFiscalData: {},

    init: async function() {
        console.log("ProveedoresController: Iniciando...");
        await this.applyFiltersAndPagination();
        this.setupEvents();
        this.setupSortEvents();
    },

    // --- LÓGICA DE ORDENAMIENTO ---
    sortProviders(list, key, direction) {
        list.sort((a, b) => {
            let valA = a[key] ? a[key].toString().toLowerCase() : '';
            let valB = b[key] ? b[key].toString().toLowerCase() : '';
            let comparison = 0;
            if (valA > valB) comparison = 1;
            else if (valA < valB) comparison = -1;
            return direction === 'asc' ? comparison : comparison * -1;
        });
        return list;
    },

    // --- FUNCIÓN CENTRAL: FILTRAR, ORDENAR Y PAGINAR ---
    async applyFiltersAndPagination() {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const providers = await providersDB.getProviders();

        const filtered = providers.filter(p => 
            (p.name && p.name.toLowerCase().includes(searchTerm)) || 
            (p.taxId && p.taxId.includes(searchTerm)) ||
            (p.insumos && p.insumos.toLowerCase().includes(searchTerm))
        );

        const sorted = this.sortProviders(filtered, this.sortState.key, this.sortState.direction);
        const totalItems = sorted.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);

        if (this.currentPage > totalPages && totalPages > 0) this.currentPage = totalPages;
        if (this.currentPage < 1) this.currentPage = 1;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginated = sorted.slice(startIndex, endIndex);

        this.renderTable(paginated);
        this.renderPagination(totalItems, startIndex + 1, Math.min(endIndex, totalItems), totalPages);
    },

    renderTable(list) {
        const tbody = document.getElementById('provider-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">No hay proveedores registrados o no cumplen con los criterios de búsqueda.</td></tr>';
            this.updateTableHeader(); 
            return;
        }
        
        this.updateTableHeader();

        list.forEach(p => {
            const rawInsumos = p.insumos || ''; 
            const insumosArray = rawInsumos.split(',');

            const insumosHtml = insumosArray
                .filter(tag => tag.trim().length > 0)
                .map(tag => 
                    `<span class="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full mr-1 inline-block my-1">${tag.trim()}</span>`
                ).join('');

            const row = `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 font-bold text-gray-900">${p.name}</td>
                    <td class="px-6 py-4 text-gray-500 font-mono">${p.taxId}</td>
                    <td class="px-6 py-4 text-gray-700">${p.contact}</td>
                    <td class="px-6 py-4">${insumosHtml}</td>
                    <td class="px-6 py-4 text-center space-x-2">
                        <button class="text-blue-600 p-2 rounded hover:bg-blue-100 btn-edit" data-id="${p.id}"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        <button class="text-red-600 p-2 rounded hover:bg-blue-100 btn-delete" data-id="${p.id}" data-name="${p.name}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
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
            container.innerHTML = '<span class="text-sm text-gray-500">Sin resultados.</span>';
            return;
        }

        container.innerHTML = `
            <div class="text-sm text-gray-600">
                Mostrando <span class="font-bold text-gray-900">${startItem}</span> a <span class="font-bold text-gray-900">${endItem}</span> de <span class="font-bold text-gray-900">${totalItems}</span> proveedores
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
                this.applyFiltersAndPagination();
            }
        });
        document.getElementById('btn-next-page')?.addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.applyFiltersAndPagination();
            }
        });
    },

    updateTableHeader() {
        const thead = document.querySelector('.table-header-bg tr');
        if (!thead) return;
        const sortKey = this.sortState.key;
        const sortDir = this.sortState.direction;
        const getSortIcon = (key) => {
            if (sortKey === key) {
                return `<i data-lucide="${sortDir === 'asc' ? 'arrow-down-narrow-wide' : 'arrow-up-narrow-wide'}" class="w-4 h-4 mr-1"></i>`;
            }
            return '';
        };

        thead.innerHTML = `
            <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer" data-sort-key="name">
                <div class="flex items-center justify-start">${getSortIcon('name')}Nombre del Proveedor</div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer" data-sort-key="taxId">
                <div class="flex items-center justify-start">${getSortIcon('taxId')}RUC/NIT</div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer" data-sort-key="contact">
                <div class="flex items-center justify-start">${getSortIcon('contact')}Contacto Principal</div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer" data-sort-key="insumos">
                <div class="flex items-center justify-start">${getSortIcon('insumos')}Categoría</div>
            </th>
            <th class="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Acciones</th>
        `;
        if(window.lucide) window.lucide.createIcons();
    },

    setupSortEvents() {
        const thead = document.querySelector('.table-header-bg');
        if (!thead) return;
        const newThead = thead.cloneNode(true);
        thead.parentNode.replaceChild(newThead, thead);
        
        newThead.addEventListener('click', (e) => {
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
                this.applyFiltersAndPagination();
            }
        });
    },

    addCategoryField(containerElement, initialValue = '') {
        if (!containerElement) return;
        
        const inputId = `category-input-${Date.now()}`;
        const inputHtml = `
            <div class="flex items-center space-x-2 dynamic-category-row mt-2">
                <input type="text" id="${inputId}" value="${initialValue}" placeholder="Añadir otra categoría" class="form-input dynamic-category-input w-full px-3 py-2 border border-gray-300 rounded-lg">
                <button type="button" class="text-red-500 hover:text-red-700 p-2 btn-remove-category">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        containerElement.insertAdjacentHTML('beforeend', inputHtml);
        if(window.lucide) window.lucide.createIcons(); 
    },

    collectCategories(formElement) {
        if (!formElement) return '';
        const allInputs = formElement.querySelectorAll('.dynamic-category-input');
        let allCategories = [];
        allInputs.forEach(input => {
            if (input.value.trim().length > 0) {
                allCategories.push(input.value.trim());
            }
        });
        return allCategories.join(',');
    },

    // --- NUEVA LÓGICA DE BÚSQUEDA API (IMPLEMENTADA AQUÍ) ---
    // --- NUEVA LÓGICA DE BÚSQUEDA API (CORREGIDA) ---
    async handleSearchProvider(mode) {
        const isCreate = mode === 'create';
        const inputId = isCreate ? 'provider-create-tax-id' : 'provider-edit-tax-id';
        const nameInputId = isCreate ? 'provider-create-name' : 'provider-edit-name';
        const btnId = isCreate ? 'btn-search-ruc-create' : 'btn-search-ruc-edit';

        // CORRECCIÓN: Buscamos los elementos DENTRO del contenedor del modal activo
        // para evitar seleccionar los inputs vacíos de la plantilla oculta.
        const modalContainer = document.getElementById('provider-modal-container');
        
        if (!modalContainer) {
            console.error("No se encontró el contenedor del modal activo.");
            return;
        }

        const inputRuc = modalContainer.querySelector(`#${inputId}`);
        const inputName = modalContainer.querySelector(`#${nameInputId}`);
        const btnSearch = modalContainer.querySelector(`#${btnId}`);
        
        // Si por alguna razón no encuentra el input (ej. error de renderizado), detenemos.
        if (!inputRuc) return;

        const icon = btnSearch?.querySelector('i');

        const ruc = inputRuc.value.trim();

        // 1. Validación estricta: Solo RUC (11 dígitos)
        if (!ruc) {
            window.UI.showNotification('Atención', 'Ingrese un número de RUC.');
            return;
        }
        if (ruc.length !== 11) {
            window.UI.showNotification('Error', 'Solo se permiten búsquedas de RUC (11 dígitos).');
            return;
        }

        // UI Loading
        const originalIcon = icon ? icon.getAttribute('data-lucide') : 'search';
        if (icon) {
            icon.setAttribute('data-lucide', 'loader-2');
            icon.classList.add('animate-spin');
            if (window.lucide) window.lucide.createIcons();
        }
        if (btnSearch) btnSearch.disabled = true;

        try {
            // 2. LLAMADA DIRECTA A LA API
            const response = await fetch(`https://dniruc.apisperu.com/api/v1/ruc/${ruc}?token=${API_TOKEN}`);
            
            if (!response.ok) throw new Error('Error en la conexión con SUNAT/API');
            
            const data = await response.json();

            // Validar respuesta de la API
            if (data.success === false) {
                throw new Error('RUC no encontrado o inválido.');
            }

            // ÉXITO
            window.UI.showNotification('Éxito', 'Datos fiscales obtenidos de SUNAT.');

            // 3. Autocompletar Nombre
            if (inputName) inputName.value = data.razonSocial || '';

            // 4. Guardar TODOS los datos extra en memoria temporal
            // MODIFICACIÓN: Asignamos 'address' explícitamente usando 'data.direccion' de la API
            const fiscalData = {
                address: data.direccion || '',  // <--- ESTO ES LO QUE FALTABA
                direccion: data.direccion || '', // Guardamos ambos por seguridad
                departamento: data.departamento || '',
                provincia: data.provincia || '',
                distrito: data.distrito || '',
                ubigeo: data.ubigeo || '',
                estado_sunat: data.estado || '',
                condicion_sunat: data.condicion || ''
            };

            if (isCreate) {
                this.tempCreateFiscalData = fiscalData;
            } else {
                this.tempEditFiscalData = fiscalData;
            }

        } catch (error) {
            console.error("Error buscando RUC:", error);
            window.UI.showNotification('Error', error.message || 'No se pudo consultar el RUC.');
        } finally {
            // Restaurar UI
            if (btnSearch) btnSearch.disabled = false;
            if (icon) {
                icon.classList.remove('animate-spin');
                icon.setAttribute('data-lucide', originalIcon);
                if (window.lucide) window.lucide.createIcons();
            }
        }
    },

    // --- MANEJO DE FORMULARIOS ---
    
    handleModalSubmit: async function(e) {
        // CREAR
        if (e.target.id === 'provider-create-form') {
            e.preventDefault();
            const form = e.target;
            
            // Recopilar datos básicos
            const basicData = {
                name: form.querySelector('#provider-create-name').value,
                taxId: form.querySelector('#provider-create-tax-id').value,
                contact: form.querySelector('#provider-create-contact').value,
                insumos: this.collectCategories(form) 
            };

            if (!basicData.name || !basicData.taxId) {
                window.UI.showNotification('Error', 'Datos incompletos.');
                return;
            }

            // FUSIONAR: Datos Básicos + Datos Fiscales de API (si existen)
            const fullProviderData = { 
                ...basicData, 
                ...this.tempCreateFiscalData 
            };

            await providersDB.addProvider(fullProviderData);
            
            // Limpieza
            this.tempCreateFiscalData = {}; 
            window.UI.hideModal('provider-modal-container');
            window.UI.showNotification('Éxito', 'Proveedor agregado.');
            
            this.currentPage = 1; 
            this.applyFiltersAndPagination();
        }
        
        // EDITAR
        else if (e.target.id === 'provider-edit-form') {
            e.preventDefault();
            const form = e.target;
            const id = form.querySelector('#provider-edit-id-field').value;
            
            const basicUpdates = {
                name: form.querySelector('#provider-edit-name').value,
                taxId: form.querySelector('#provider-edit-tax-id').value,
                contact: form.querySelector('#provider-edit-contact').value,
                insumos: this.collectCategories(form) 
            };

            // FUSIONAR: Datos Básicos + Datos Fiscales de API (si existen)
            const fullUpdates = { 
                ...basicUpdates, 
                ...this.tempEditFiscalData 
            };

            await providersDB.updateProvider(id, fullUpdates);
            
            // Limpieza
            this.tempEditFiscalData = {};
            window.UI.hideModal('provider-modal-container');
            window.UI.showNotification('Actualizado', 'Datos guardados.');
            this.applyFiltersAndPagination();
        }
    },

    handleModalClick: function(e) {
        // CLICK EN BÚSQUEDA (CREAR)
        const btnSearchCreate = e.target.closest('#btn-search-ruc-create');
        if (btnSearchCreate) {
            this.handleSearchProvider('create');
            return;
        }

        // CLICK EN BÚSQUEDA (EDITAR)
        const btnSearchEdit = e.target.closest('#btn-search-ruc-edit');
        if (btnSearchEdit) {
            this.handleSearchProvider('edit');
            return;
        }

        // AÑADIR CATEGORÍA
        const btnAdd = e.target.closest('#btn-add-category-create') || e.target.closest('#btn-add-category-edit');
        if (btnAdd) {
            const form = btnAdd.closest('form');
            const containerId = btnAdd.id === 'btn-add-category-create' ? '#category-fields-container-create' : '#category-fields-container-edit';
            const container = form.querySelector(containerId);
            this.addCategoryField(container);
            return;
        }
        
        // ELIMINAR CATEGORÍA
        const btnRemove = e.target.closest('.btn-remove-category');
        if (btnRemove) {
            btnRemove.closest('.dynamic-category-row')?.remove();
        }
    },

    setupEvents() {
        // Listener de búsqueda de tabla
        document.getElementById('search-input')?.addEventListener('input', () => {
            this.currentPage = 1;
            this.applyFiltersAndPagination();
        });

        // === GESTIÓN DE LISTENERS MODAL ===
        const modalContainer = document.getElementById('provider-modal-container');
        if (modalContainer) {
            if (!this._submitHandler) this._submitHandler = this.handleModalSubmit.bind(this);
            if (!this._clickHandler) this._clickHandler = this.handleModalClick.bind(this);

            modalContainer.removeEventListener('submit', this._submitHandler);
            modalContainer.removeEventListener('click', this._clickHandler);

            modalContainer.addEventListener('submit', this._submitHandler);
            modalContainer.addEventListener('click', this._clickHandler);
        }

        // Listener Botón "Agregar Proveedor"
        document.getElementById('btn-add-provider')?.addEventListener('click', () => {
            const originalForm = document.getElementById('provider-create-form');
            if(originalForm) originalForm.reset();
            this.tempCreateFiscalData = {}; // Resetear datos temporales

            window.UI.showModal('provider-modal-container', 'provider-create-modal-content');
            
            setTimeout(() => {
                const container = document.getElementById('provider-modal-container');
                const catContainer = container.querySelector('#category-fields-container-create');
                if(catContainer) {
                    catContainer.innerHTML = `
                        <div class="flex items-center space-x-2">
                            <input type="text" id="provider-create-insumos" placeholder="Ej: Papel Bond" class="form-input dynamic-category-input w-full px-3 py-2 border border-gray-300 rounded-lg">
                        </div>
                    `;
                }
            }, 50);
        });

        // Listener de Tabla (Editar/Borrar)
        const tableBody = document.getElementById('provider-table-body');
        if (tableBody) {
            const newTableBody = tableBody.cloneNode(true);
            tableBody.parentNode.replaceChild(newTableBody, tableBody);
            
            newTableBody.addEventListener('click', async (e) => {
                // Eliminar
                const btnDelete = e.target.closest('.btn-delete');
                if (btnDelete) {
                    const { id, name } = btnDelete.dataset;
                    window.UI.showConfirmModal('Eliminar', `¿Borrar a ${name}?`, 'Borrar', async () => {
                        await providersDB.deleteProvider(id);
                        this.applyFiltersAndPagination();
                    });
                }
                
                // Editar
                const btnEdit = e.target.closest('.btn-edit');
                if (btnEdit) {
                    const id = btnEdit.dataset.id;
                    const providers = await providersDB.getProviders();
                    const p = providers.find(x => x.id === id);
                    
                    if(p) {
                        this.tempEditFiscalData = {}; // Resetear datos temporales
                        window.UI.showModal('provider-modal-container', 'provider-edit-modal-content');
                        setTimeout(() => {
                            const modalContainer = document.getElementById('provider-modal-container');
                            if (modalContainer) {
                                const editForm = modalContainer.querySelector('#provider-edit-form');
                                if(!editForm) return;

                                editForm.querySelector('#provider-edit-id-field').value = p.id;
                                editForm.querySelector('#provider-edit-name').value = p.name;
                                editForm.querySelector('#provider-edit-tax-id').value = p.taxId;
                                editForm.querySelector('#provider-edit-contact').value = p.contact; 

                                // Categorías
                                const categoryContainer = editForm.querySelector('#category-fields-container-edit');
                                categoryContainer.innerHTML = '';
                                
                                const categoryArray = p.insumos ? p.insumos.split(',').map(c => c.trim()) : [];
                                const firstCategory = categoryArray.length > 0 ? categoryArray[0] : '';
                                
                                categoryContainer.innerHTML = `
                                    <div class="flex items-center space-x-2">
                                        <input type="text" id="provider-edit-insumos" value="${firstCategory}" placeholder="Ej: Tintas UV" class="form-input dynamic-category-input w-full px-3 py-2 border border-gray-300 rounded-lg">
                                    </div>
                                `;
                                for (let i = 1; i < categoryArray.length; i++) {
                                    this.addCategoryField(categoryContainer, categoryArray[i]);
                                }
                            }
                        }, 50);
                    }
                }
            });
        }
    }
};