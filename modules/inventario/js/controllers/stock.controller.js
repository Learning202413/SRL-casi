/**
 * js/controllers/stock.controller.js
 * Controlador para Inventario.
 * ACTUALIZADO: Cálculo de totales automático con precio oculto en la selección.
 */
import { StockService } from '../services/stock.service.js';

export const StockController = {
    ocItems: [], 
    currentCategories: [],
    selectedProductProviders: [],
    tempSelectedProduct: null, // Variable para retener el precio internamente
    
    _boundHandleOCClick: null,
    _boundHandleOCSubmit: null,
    _boundHandleItemSubmit: null,
    _boundHandleTableAction: null,

    init: async function() {
        console.log("StockController inicializado.");
        await this.renderTable();
        this.setupEvents();
    },

    async renderTable() {
        const products = await StockService.getProducts();
        const tbody = document.getElementById('inventory-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        products.forEach(p => {
            const statusClass = p.stock <= p.min ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
            const statusText = p.stock <= p.min ? 'Stock Crítico' : 'OK';
            const precio = parseFloat(p.precio || 0).toFixed(2);
            
            const provCount = p.proveedores ? p.proveedores.length : (p.proveedor_id ? 1 : 0);
            const provLabel = provCount > 1 ? `(${provCount} Prov.)` : '';

            const row = `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm font-mono text-gray-500">${p.sku}</td>
                    <td class="px-6 py-4 text-sm font-bold text-gray-900">
                        ${p.nombre} 
                        <span class="text-xs text-gray-400 font-normal ml-1">${provLabel}</span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">${p.categoria || '-'}</td>
                    <td class="px-6 py-4 text-sm font-bold text-center text-blue-700">${p.abc || '-'}</td>
                    <td class="px-6 py-4 text-sm text-right text-gray-700">S/ ${precio}</td>
                    <td class="px-6 py-4 text-sm font-bold text-center text-gray-800">${p.stock}</td>
                    <td class="px-6 py-4 text-sm font-bold text-center text-gray-500">${p.min}</td>
                    <td class="px-6 py-4 text-sm"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${statusText}</span></td>
                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button class="text-blue-600 p-1 btn-edit-item" data-sku="${p.sku}" title="Editar"><i data-lucide="edit" class="w-5 h-5"></i></button>
                        <button class="text-red-600 p-1 btn-delete-item" data-sku="${p.sku}" data-name="${p.nombre}" title="Eliminar"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                    </td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        if(window.lucide) window.lucide.createIcons();
    },

    getElementInModal(modalId, selector) {
        const container = document.getElementById(modalId);
        return container ? container.querySelector(selector) : null;
    },

    renderProviderChips() {
        const container = this.getElementInModal('item-modal-container', '#selected-providers-container');
        if (!container) return;
        container.innerHTML = '';

        this.selectedProductProviders.forEach((prov, index) => {
            const chip = document.createElement('div');
            chip.className = 'flex items-center bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200 animate-fade-in-up';
            chip.innerHTML = `
                <span>${prov.nombre}</span>
                <button type="button" class="ml-2 text-blue-600 hover:text-red-600 remove-prov-chip" data-index="${index}" title="Quitar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            `;
            container.appendChild(chip);
        });

        container.querySelectorAll('.remove-prov-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                this.selectedProductProviders.splice(idx, 1);
                this.renderProviderChips();
                
                if (this.selectedProductProviders.length === 0) {
                   this.currentCategories = [];
                   const catInput = this.getElementInModal('item-modal-container', '#item-category-search');
                   if(catInput) {
                       catInput.value = '';
                       catInput.disabled = true;
                       catInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                   }
                }
            });
        });
    },

    // --- BUSCADOR GENÉRICO ---
    setupSearch(modalId, inputId, listId, fetchDataFn, onSelectFn) {
        const input = this.getElementInModal(modalId, `#${inputId}`);
        const list = this.getElementInModal(modalId, `#${listId}`);
        if (!input || !list) return;

        const renderList = async (query) => {
            try {
                const results = await fetchDataFn(query);
                list.innerHTML = '';
                if (!results || results.length === 0) {
                    list.innerHTML = '<div class="p-3 text-gray-500 text-sm italic">No se encontraron datos</div>';
                } else {
                    results.forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 text-sm transition-colors flex justify-between items-center group';
                        
                        if (item.name) { 
                            div.innerHTML = `<div><div class="font-bold text-gray-800">${item.name}</div><div class="text-xs text-gray-500">RUC: ${item.taxId}</div></div>`;
                        } else if (item.nombre) { 
                            div.innerHTML = `<div><div class="font-bold text-gray-800">${item.nombre}</div></div><span class="text-xs font-mono text-gray-500">${item.sku}</span>`;
                        } else { 
                            div.innerHTML = `<span class="font-medium text-gray-700">${item}</span>`;
                        }

                        div.addEventListener('click', (e) => {
                            e.stopPropagation();
                            onSelectFn(item);
                            list.classList.add('hidden'); // Esto oculta la lista
                        });
                        list.appendChild(div);
                    });
                }
                list.classList.remove('hidden');
            } catch (err) { console.error(err); }
        };

        input.addEventListener('input', (e) => renderList(e.target.value));
        input.addEventListener('click', () => { if(!input.disabled) renderList(''); });
        input.addEventListener('focus', () => { if(!input.disabled) renderList(''); });
        document.addEventListener('click', (e) => {
            if (document.body.contains(input) && !input.contains(e.target) && !list.contains(e.target)) {
                list.classList.add('hidden');
            }
        });
    },

    // --- HANDLERS ---
    
    async handleTableAction(e) {
        const btnEdit = e.target.closest('.btn-edit-item');
        const btnDelete = e.target.closest('.btn-delete-item');

        if (btnEdit) {
            const sku = btnEdit.dataset.sku;
            const product = await StockService.getProductBySku(sku);
            
            if (product) {
                this.currentCategories = []; 
                window.UI.showModal('item-modal-container', 'item-modal-content');
                
                setTimeout(() => {
                    this.setupItemProviderSearch(); 
                    this.setupCategorySearch();

                    const container = document.getElementById('item-modal-container');
                    container.querySelector('#item-modal-title').textContent = 'Editar Insumo';
                    container.querySelector('#item-edit-mode').value = 'true';
                    container.querySelector('#item-original-sku').value = sku;
                    
                    if (product.proveedores && Array.isArray(product.proveedores)) {
                        this.selectedProductProviders = [...product.proveedores];
                    } else if (product.proveedor_id) {
                        this.selectedProductProviders = [{
                            id: product.proveedor_id,
                            nombre: product.proveedor_nombre || 'Sin Nombre'
                        }];
                    } else {
                        this.selectedProductProviders = [];
                    }
                    this.renderProviderChips();

                    container.querySelector('#item-sku-display').value = sku;
                    container.querySelector('#item-name').value = product.nombre;
                    container.querySelector('#item-price').value = product.precio || '';
                    container.querySelector('#item-stock').value = product.stock;
                    container.querySelector('#item-min').value = product.min;
                    container.querySelector('#item-abc').value = product.abc || 'A';
                    container.querySelector('#item-desc').value = product.descripcion || '';

                    const catInput = container.querySelector('#item-category-search');
                    catInput.disabled = false;
                    catInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    catInput.value = product.categoria;
                    
                    this.currentCategories = [product.categoria]; 
                }, 100);
            }
        }

        if (btnDelete) {
            const sku = btnDelete.dataset.sku;
            const name = btnDelete.dataset.name;
            if(confirm(`¿Estás seguro de eliminar "${name}"?`)) {
                await StockService.deleteProduct(sku);
                window.UI.showNotification('Eliminado', 'Producto eliminado.');
                this.renderTable();
            }
        }
    },

    async handleItemSubmit(e) {
        if (e.target.id === 'item-form') {
            e.preventDefault();
            const form = e.target;
            const isEdit = form.querySelector('#item-edit-mode').value === 'true';
            const originalSku = form.querySelector('#item-original-sku').value;

            if (this.selectedProductProviders.length === 0) {
                alert("Debe seleccionar al menos un proveedor.");
                return;
            }

            const itemData = {
                proveedores: this.selectedProductProviders,
                proveedor_id: this.selectedProductProviders[0].id,
                proveedor_nombre: this.selectedProductProviders[0].nombre,
                nombre: form.querySelector('#item-name').value,
                categoria: form.querySelector('#item-category-search').value,
                abc: form.querySelector('#item-abc').value,
                precio: parseFloat(form.querySelector('#item-price').value) || 0,
                stock: parseInt(form.querySelector('#item-stock').value) || 0,
                min: parseInt(form.querySelector('#item-min').value) || 0,
                descripcion: form.querySelector('#item-desc').value
            };
            
            if(!itemData.categoria) { alert("Categoría obligatoria."); return; }

            if (isEdit) {
                await StockService.updateProduct(originalSku, itemData);
                window.UI.showNotification('Actualizado', 'Producto modificado.');
            } else {
                await StockService.addProduct(itemData);
                window.UI.showNotification('Éxito', 'Producto agregado.');
            }
            
            window.UI.hideModal('item-modal-container');
            this.renderTable();
        }
    },

    // 2. MANEJO DEL CLIC EN AÑADIR ÍTEM A LA OC
    handleOCClick(e) {
        const modalContainerOC = document.getElementById('oc-modal-container');
        const btnAdd = e.target.closest('#btn-add-oc-item');
        
        if (btnAdd) {
            e.preventDefault();
            const nameInput = modalContainerOC.querySelector('#oc-product-search');
            const qtyInput = modalContainerOC.querySelector('#oc-qty');

            const name = nameInput?.value.trim();
            const qty = parseFloat(qtyInput?.value);

            if (name && qty > 0) {
                // REGLA: Usar precio del objeto en memoria
                let price = 0;
                if (this.tempSelectedProduct && this.tempSelectedProduct.nombre === name) {
                    price = parseFloat(this.tempSelectedProduct.precio || 0);
                }

                this.ocItems.push({ 
                    producto: name, 
                    cantidad: qty,
                    precio: price 
                });
                
                this.renderOCItems();
                
                // Resetear campos
                if(nameInput) nameInput.value = '';
                if(qtyInput) qtyInput.value = '';

                this.tempSelectedProduct = null; 
                nameInput?.focus();
            } else {
                alert("Seleccione producto de la lista y cantidad válida.");
            }
        }

        const btnRemove = e.target.closest('.remove-item');
        if (btnRemove) {
            const idx = parseInt(btnRemove.dataset.idx);
            this.ocItems.splice(idx, 1);
            this.renderOCItems();
        }
    },

    async handleOCSubmit(e) {
        if (e.target.id === 'oc-form') {
            e.preventDefault();
            const form = e.target;
            const pid = form.querySelector('#oc-provider-id').value;
            
            if(!pid || this.ocItems.length === 0) { alert("Seleccione proveedor y agregue items."); return; }
            
            // Calcular total para guardar en DB (Esencial para el PDF)
            const total = this.ocItems.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);

            const newOC = {
                proveedor_id: pid,
                proveedor_nombre: form.querySelector('#oc-provider-search').value,
                items: this.ocItems,
                total: total, 
                notas: form.querySelector('#oc-notes').value
            };
            
            await StockService.createOC(newOC);
            window.UI.hideModal('oc-modal-container');
            window.UI.showNotification('Éxito', 'OC generada.');
        }
    },

    // --- CONFIGURACIÓN ---

    setupItemProviderSearch() {
        this.setupSearch('item-modal-container', 'item-provider-search', 'item-provider-list',
            async (query) => await StockService.searchProviders(query),
            (provider) => {
                const exists = this.selectedProductProviders.some(p => p.id === provider.id);
                if (!exists) {
                    this.selectedProductProviders.push({ id: provider.id, nombre: provider.name });
                    
                    this.renderProviderChips(); 

                    const newCats = provider.insumos ? provider.insumos.split(',').map(s => s.trim()) : [];
                    this.currentCategories = [...new Set([...this.currentCategories, ...newCats])];

                    const input = this.getElementInModal('item-modal-container', '#item-provider-search');
                    input.value = ''; 
                    
                    const catInput = this.getElementInModal('item-modal-container', '#item-category-search');
                    if (catInput) { catInput.disabled = false; catInput.classList.remove('bg-gray-100', 'cursor-not-allowed'); }
                } else {
                    const input = this.getElementInModal('item-modal-container', '#item-provider-search');
                    input.value = '';
                    input.placeholder = "¡Ya añadido!";
                    setTimeout(() => input.placeholder = "Buscar y seleccionar proveedor...", 1500);
                }
            }
        );
    },
    setupCategorySearch() {
        this.setupSearch('item-modal-container', 'item-category-search', 'item-category-list',
            async (query) => { const cats = this.currentCategories; if(!query) return cats; return cats.filter(c => c.toLowerCase().includes(query.toLowerCase())); },
            (cat) => { this.getElementInModal('item-modal-container', '#item-category-search').value = cat; }
        );
    },
    setupOCProviderSearch() {
        this.setupSearch('oc-modal-container', 'oc-provider-search', 'oc-provider-list',
            async (query) => await StockService.searchProviders(query),
            (provider) => {
                const nameInput = this.getElementInModal('oc-modal-container', '#oc-provider-search');
                const idInput = this.getElementInModal('oc-modal-container', '#oc-provider-id');
                if(nameInput) nameInput.value = provider.name;
                if(idInput) idInput.value = provider.id;
                this.ocItems = [];
                this.renderOCItems();
                const prodInput = this.getElementInModal('oc-modal-container', '#oc-product-search');
                if (prodInput) { prodInput.disabled = false; prodInput.placeholder = `Buscar productos de ${provider.name}...`; prodInput.value = ''; prodInput.focus(); }
            }
        );
    },
    
    // 1. BUSCADOR EN OC: Captura precio pero no lo muestra en la zona de input
    setupOCProductSearch() {
        this.setupSearch('oc-modal-container', 'oc-product-search', 'oc-product-list',
            async (query) => {
                const idInput = this.getElementInModal('oc-modal-container', '#oc-provider-id');
                const pid = idInput ? idInput.value : null;
                if (!pid) return [];
                return await StockService.getProductsForProvider(pid, query);
            },
            (product) => {
                // Guardar lógica
                this.tempSelectedProduct = product; 
                
                const prodInput = this.getElementInModal('oc-modal-container', '#oc-product-search');
                const qtyInput = this.getElementInModal('oc-modal-container', '#oc-qty');
                
                if(prodInput) prodInput.value = product.nombre;
                if(qtyInput) {
                    qtyInput.value = ''; 
                    qtyInput.focus();
                }
            }
        );
    },

    renderOCItems() {
        const tbody = this.getElementInModal('oc-modal-container', '#oc-items-table-body');
        if(!tbody) return;
        tbody.innerHTML = '';

        let grandTotal = 0;

        this.ocItems.forEach((item, idx) => {
            const lineTotal = item.cantidad * item.precio;
            grandTotal += lineTotal;

            tbody.innerHTML += `
                <tr class="border-b hover:bg-gray-50">
                    <td class="p-2 text-sm text-gray-700">${item.producto}</td>
                    <td class="p-2 text-right text-sm">S/ ${item.precio.toFixed(2)}</td>
                    <td class="p-2 text-right text-sm font-mono">${item.cantidad}</td>
                    <td class="p-2 text-right text-sm font-bold text-gray-800">S/ ${lineTotal.toFixed(2)}</td>
                    <td class="p-2 text-right">
                        <button type="button" class="text-red-500 hover:text-red-700 font-bold remove-item p-1" data-idx="${idx}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>`;
        });
        
        // CÁLCULOS
        const subtotal = grandTotal / 1.18;
        const igv = grandTotal - subtotal;

        // Actualizar footer visual
        const container = document.getElementById('oc-modal-container');
        if(container) {
            container.querySelector('#oc-display-subtotal').textContent = `S/ ${subtotal.toFixed(2)}`;
            container.querySelector('#oc-display-igv').textContent = `S/ ${igv.toFixed(2)}`;
            container.querySelector('#oc-display-total').textContent = `S/ ${grandTotal.toFixed(2)}`;
        }

        if(window.lucide) window.lucide.createIcons();
    },

    setupEvents() {
        const filterButton = document.getElementById('filter-button');
        const filterPanel = document.getElementById('filter-panel');
        if (filterButton && filterPanel) filterButton.onclick = () => filterPanel.classList.toggle('hidden');

        if (!this._boundHandleOCClick) {
            this._boundHandleOCClick = this.handleOCClick.bind(this);
            this._boundHandleOCSubmit = this.handleOCSubmit.bind(this);
            this._boundHandleItemSubmit = this.handleItemSubmit.bind(this);
            this._boundHandleTableAction = this.handleTableAction.bind(this);
        }

        const tableBody = document.getElementById('inventory-table-body');
        if (tableBody) {
            tableBody.removeEventListener('click', this._boundHandleTableAction);
            tableBody.addEventListener('click', this._boundHandleTableAction);
        }

        const modalContainerOC = document.getElementById('oc-modal-container');
        if (modalContainerOC) {
            modalContainerOC.removeEventListener('click', this._boundHandleOCClick);
            modalContainerOC.removeEventListener('submit', this._boundHandleOCSubmit);
            modalContainerOC.addEventListener('click', this._boundHandleOCClick);
            modalContainerOC.addEventListener('submit', this._boundHandleOCSubmit);
        }

        const modalContainerItem = document.getElementById('item-modal-container');
        if (modalContainerItem) {
            modalContainerItem.removeEventListener('submit', this._boundHandleItemSubmit);
            modalContainerItem.addEventListener('submit', this._boundHandleItemSubmit);
        }

        document.getElementById('btn-add-item')?.addEventListener('click', () => {
            this.currentCategories = []; 
            this.selectedProductProviders = []; 
            
            window.UI.showModal('item-modal-container', 'item-modal-content');
            setTimeout(() => {
                const container = document.getElementById('item-modal-container');
                container.querySelector('#item-form').reset();
                container.querySelector('#item-modal-title').textContent = 'Agregar Nuevo Insumo';
                container.querySelector('#item-edit-mode').value = 'false';
                
                this.renderProviderChips(); 
                this.setupItemProviderSearch(); 
                this.setupCategorySearch(); 
            }, 100);
        });

        document.getElementById('btn-create-oc')?.addEventListener('click', () => {
            this.ocItems = [];
            window.UI.showModal('oc-modal-container', 'oc-modal-content');
            setTimeout(() => { 
                const form = document.getElementById('oc-form');
                if(form) form.reset();
                document.getElementById('oc-provider-id').value = '';
                
                // Resetear visuales
                document.getElementById('oc-display-subtotal').textContent = 'S/ 0.00';
                document.getElementById('oc-display-igv').textContent = 'S/ 0.00';
                document.getElementById('oc-display-total').textContent = 'S/ 0.00';

                this.setupOCProviderSearch(); 
                this.setupOCProductSearch(); 
                this.renderOCItems(); 
            }, 100);
        });
    }
};