/**
 * js/controllers/orden.detalle.controller.js
 * Controlador Actualizado:
 * - Botón de Facturación INTELIGENTE (Boleta vs Factura).
 * - CORRECCIÓN VISUAL: En el buscador de clientes, muestra "DNI" o "RUC" según corresponda.
 */
import { OrdenDetalleService } from '../services/orden.detalle.service.js';
import { ClientesService } from '../services/clientes.service.js'; 
import { FacturacionService } from '../services/facturacion.service.js';

export const OrdenDetalleController = {
    currentOrderId: null,
    clientType: 'JURIDICA', // Valor por defecto

    init: async function(params) {
        const param1 = params[0];
        const isNewMode = !param1 || param1 === 'new';
        const preselectedClientId = isNewMode ? params[1] : null;
        const viewMode = (!isNewMode && params[1]) ? params[1] : 'view'; 
        this.currentOrderId = isNewMode ? null : param1;
        
        const form = document.getElementById('order-form');
        const headerTitle = document.getElementById('order-header');

        if (form) {
            form.classList.remove('hidden');
            form.classList.add('animate-fade-in');
        }
        if (headerTitle) headerTitle.textContent = 'Cargando datos...';

        try {
            if (!isNewMode) {
                // 1. Obtener la Orden
                const order = await OrdenDetalleService.getOrderById(this.currentOrderId);
                
                if (order) {
                    // 2. Obtener DATOS DEL CLIENTE para saber si es Natural o Jurídica
                    const fullClient = await ClientesService.getClientById(order.cliente_id);
                    if (fullClient) {
                        // Lógica de detección
                        const isNatural = (fullClient.tipo_persona === 'NATURAL') || 
                                          (!fullClient.tipo_persona && fullClient.ruc && fullClient.ruc.length === 8);
                        
                        this.clientType = isNatural ? 'NATURAL' : 'JURIDICA';
                    }

                    this.populateForm(order);
                    this.configureButtonsForExisting(order, viewMode);
                } else {
                    window.UI.showNotification('Error', 'Orden no encontrada.');
                    return;
                }
            } else {
                this.setupNewOrderUI();
                this.toggleButtonGroups('new'); 
                if (preselectedClientId) {
                    const client = await ClientesService.getClientById(preselectedClientId);
                    if (client) this.setClientSelection(client);
                }
            }

            this.setupEvents(this.currentOrderId);
            this.setupClientSearch(); 
            if (window.lucide) window.lucide.createIcons();
            
        } catch (error) {
            console.error("Error en OrdenDetalleController:", error);
            window.UI.showNotification('Error', 'Ocurrió un problema al cargar.');
        }
    },

    async processInvoiceGeneration(type) {
        if (!this.currentOrderId) return;
        
        window.UI.showNotification('Procesando...', `Generando ${type}...`);
        
        const result = await FacturacionService.generateDocumentFromOT(this.currentOrderId, type);
        if (result.success) {
            window.UI.showNotification('Éxito', result.message);
            this.init([this.currentOrderId, 'view']); 
        } else {
            window.UI.showNotification('Error', result.message);
        }
    },

    toggleHeaderFields(showOT) {
        const codeDisplay = document.getElementById('display-code');
        const otDisplay = document.getElementById('display-ot-id');
        
        if (showOT) {
            codeDisplay?.parentElement.classList.add('hidden');
            otDisplay?.parentElement.classList.remove('hidden');
        } else {
            codeDisplay?.parentElement.classList.remove('hidden');
            otDisplay?.parentElement.classList.add('hidden');
        }
    },

    setupNewOrderUI() {
        const header = document.getElementById('order-header');
        if(header) header.textContent = 'Crear Nueva Cotización';
        const displayCode = document.getElementById('display-code');
        if(displayCode) displayCode.textContent = 'BORRADOR';
        
        this.toggleHeaderFields(false);
        
        const container = document.getElementById('product-lines-container');
        if (container) {
            container.innerHTML = ''; 
            this.addProductRow(); 
        }
        this.calculateTotal();
    },

    populateForm(order) {
        const otStatuses = [
            'Orden creada', 
            'En Pre-prensa', 'Diseño Pendiente', 'En diseño', 'En Aprobación de Cliente', 'Diseño Aprobado',
            'En prensa', 'Asignada a Prensa', 'En Preparación', 'Imprimiendo',
            'En Post-Prensa', 'En post-prensa', 'En Acabados', 'En Control de Calidad',
            'Completado'
        ];
        const isOT = otStatuses.includes(order.estado);

        const header = document.getElementById('order-header');
        if(header) {
            if (isOT && order.ot_id && order.ot_id !== 'PENDIENTE') {
                header.textContent = `Detalle: ${order.ot_id}`;
            } else {
                header.textContent = `Detalle: ${order.codigo}`;
            }
        }
        
        document.getElementById('display-code').textContent = order.codigo;
        document.getElementById('display-ot-id').textContent = order.ot_id;
        document.getElementById('client-id-hidden').value = order.cliente_id;
        document.getElementById('client-search').value = order.cliente_nombre;
        document.getElementById('notas_internas').value = order.notas || '';

        this.toggleHeaderFields(isOT);

        const container = document.getElementById('product-lines-container');
        if (container) {
            container.innerHTML = '';
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => this.addProductRow(item));
            } else {
                this.addProductRow();
            }
        }
        this.calculateTotal();
    },

    configureButtonsForExisting(order, mode) {
        const status = order.estado;
        const productionStatuses = [
            'Orden creada', 
            'En Pre-prensa', 'Diseño Pendiente', 'En diseño', 'En Aprobación de Cliente', 'Diseño Aprobado',
            'En prensa', 'Asignada a Prensa', 'En Preparación', 'Imprimiendo',
            'En Post-Prensa', 'En post-prensa', 'En Acabados', 'En Control de Calidad',
            'Completado'
        ];
        
        const isProduction = productionStatuses.includes(status);
        const isRejected = status === 'Rechazada';
        const shouldBlock = isProduction || isRejected || mode === 'view';
        
        this.setFormReadOnly(shouldBlock);

        if (isProduction) {
            this.toggleButtonGroups('ot', status, order);
        } else if (isRejected) {
            this.toggleButtonGroups('rejected');
        } else {
            if (mode === 'edit') {
                this.toggleButtonGroups('edit');
            } else {
                this.toggleButtonGroups('view');
            }
        }
    },

    toggleButtonGroups(scenario, status, orderData = null) {
        const editActions = document.getElementById('edit-actions'); 
        const viewActions = document.getElementById('view-actions'); 
        const otActions = document.getElementById('ot-actions');     
        const btnAddLine = document.getElementById('btn-add-line');
        const btnReject = document.getElementById('btn-reject-quote');
        const btnConvert = document.getElementById('btn-convert-ot');
        const btnInvoice = document.getElementById('btn-generate-invoice');

        editActions?.classList.add('hidden');
        viewActions?.classList.add('hidden');
        otActions?.classList.add('hidden');
        btnAddLine?.classList.add('hidden');
        btnReject?.classList.remove('hidden');
        btnConvert?.classList.remove('hidden');

        switch (scenario) {
            case 'new': 
                editActions?.classList.remove('hidden');
                viewActions?.classList.remove('hidden');
                btnReject?.classList.add('hidden');
                btnAddLine?.classList.remove('hidden');
                break;
            case 'edit': 
                editActions?.classList.remove('hidden');
                btnAddLine?.classList.remove('hidden');
                break;
            case 'view': 
                viewActions?.classList.remove('hidden');
                break;
            case 'ot': 
                otActions?.classList.remove('hidden');
                if (btnInvoice) {
                    if (status === 'Completado') {
                        btnInvoice.classList.remove('hidden');

                        if (orderData && orderData.estado_facturacion === 'Facturado') {
                            // Facturado
                            btnInvoice.disabled = true;
                            btnInvoice.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 inline mr-2"></i> Facturado`;
                            btnInvoice.classList.remove('bg-green-600', 'hover:bg-green-700', 'btn-accent', 'bg-blue-600', 'hover:bg-blue-700');
                            btnInvoice.classList.add('bg-green-400', 'cursor-not-allowed');
                        } else {
                            // Listo para facturar
                            btnInvoice.disabled = false;
                            
                            if (this.clientType === 'NATURAL') {
                                btnInvoice.innerHTML = `<i data-lucide="receipt" class="w-5 h-5 inline mr-2"></i> Emitir Boleta`;
                                btnInvoice.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'btn-critical'); 
                                btnInvoice.classList.add('bg-green-600', 'hover:bg-green-700'); 
                            } else {
                                btnInvoice.innerHTML = `<i data-lucide="file-text" class="w-5 h-5 inline mr-2"></i> Emitir Factura`;
                                btnInvoice.classList.remove('bg-green-600', 'hover:bg-green-700', 'btn-critical');
                                btnInvoice.classList.add('bg-blue-600', 'hover:bg-blue-700');
                            }
                            btnInvoice.classList.remove('bg-green-400', 'cursor-not-allowed');
                        }
                    } else {
                        btnInvoice.classList.add('hidden');
                    }
                }
                break;
        }
    },

    setFormReadOnly(isReadOnly) {
        const formInputs = document.querySelectorAll('input, select, textarea');
        formInputs.forEach(el => el.disabled = isReadOnly);
        
        const searchInput = document.getElementById('client-search');
        if(searchInput) {
            if(isReadOnly) searchInput.classList.add('bg-gray-100', 'text-gray-500');
            else searchInput.classList.remove('bg-gray-100', 'text-gray-500');
        }

        const deleteButtons = document.querySelectorAll('.btn-delete-line');
        deleteButtons.forEach(btn => {
            if (isReadOnly) btn.classList.add('hidden');
            else btn.classList.remove('hidden');
        });
    },

    setupClientSearch() {
        const input = document.getElementById('client-search');
        const hiddenInput = document.getElementById('client-id-hidden');
        const resultsDiv = document.getElementById('client-results-dropdown');
        const loadingIcon = document.getElementById('client-loading-icon');
        const icon = document.getElementById('client-search-icon');
        
        if (!input || !resultsDiv) return;
        
        const performSearch = async (query) => {
            icon?.classList.add('hidden'); loadingIcon?.classList.remove('hidden');
            try { const results = await ClientesService.searchClients(query); this.renderSearchResults(results); } 
            catch (err) { console.error(err); } finally { icon?.classList.remove('hidden'); loadingIcon?.classList.add('hidden'); }
        };
        const onInteract = () => { if (resultsDiv.classList.contains('hidden')) performSearch(input.value); };
        
        input.removeEventListener('click', onInteract);
        input.addEventListener('click', onInteract); input.addEventListener('focus', onInteract);
        
        let timeout;
        input.addEventListener('input', (e) => { 
            clearTimeout(timeout); hiddenInput.value = ''; 
            timeout = setTimeout(() => performSearch(e.target.value), 200); 
        });
        document.addEventListener('click', (e) => { if (!input.contains(e.target) && !resultsDiv.contains(e.target)) resultsDiv.classList.add('hidden'); });
    },

    // --- CORRECCIÓN AQUÍ ---
    renderSearchResults(results) {
        const resultsDiv = document.getElementById('client-results-dropdown');
        resultsDiv.innerHTML = '';
        if (results.length === 0) resultsDiv.innerHTML = '<div class="p-3 text-sm text-gray-500 text-center">No se encontraron coincidencias.</div>';
        else {
            results.forEach(client => {
                // Lógica para saber qué etiqueta mostrar
                const isNatural = (client.tipo_persona === 'NATURAL') || 
                                  (!client.tipo_persona && client.ruc && client.ruc.length === 8);
                
                const labelDoc = isNatural ? 'DNI' : 'RUC';

                const div = document.createElement('div');
                div.className = 'p-3 hover:bg-gray-100 cursor-pointer transition border-b last:border-b-0 flex justify-between items-center group';
                
                // HTML corregido dinámicamente
                div.innerHTML = `
                    <div>
                        <div class="font-bold text-gray-800 text-sm group-hover:text-red-600 transition">${client.razon_social}</div>
                        <div class="text-xs text-gray-500">${labelDoc}: ${client.ruc}</div>
                    </div>
                `;
                
                div.addEventListener('click', () => { 
                    this.setClientSelection(client); 
                    resultsDiv.classList.add('hidden'); 
                });
                resultsDiv.appendChild(div);
            });
        }
        resultsDiv.classList.remove('hidden');
    },

    setClientSelection(client) { 
        document.getElementById('client-search').value = client.razon_social; 
        document.getElementById('client-id-hidden').value = client.id;
        
        // Detectar tipo de persona para el botón de facturación
        this.clientType = (client.tipo_persona === 'NATURAL' || (!client.tipo_persona && client.ruc.length === 8)) ? 'NATURAL' : 'JURIDICA';
    },

    addProductRow(data = null) {
        const container = document.getElementById('product-lines-container');
        if (!container) return;
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 item-row';
        
        const isFormDisabled = document.getElementById('notas_internas')?.disabled;
        const hideDeleteClass = isFormDisabled ? 'hidden' : '';
        
        row.innerHTML = `
            <td class="px-3 py-2"><input type="text" value="${data?.producto || ''}" placeholder="Ej: Volantes" class="form-input w-full p-2 border border-gray-300 rounded-lg text-sm item-name" required></td>
            <td class="px-3 py-2"><input type="number" value="${data?.cantidad || 1}" min="1" class="form-input w-24 p-2 border border-gray-300 rounded-lg text-sm text-right item-qty" required></td>
            <td class="px-3 py-2"><textarea rows="1" class="form-input w-full p-2 border border-gray-300 rounded-lg text-xs item-specs">${data?.specs || ''}</textarea></td>
            <td class="px-3 py-2"><input type="number" value="${data?.precio || 0}" min="0" step="0.01" class="form-input w-24 p-2 border border-gray-300 rounded-lg text-sm text-right item-price" required></td>
            <td class="px-3 py-2 text-right text-sm font-semibold text-gray-800 item-subtotal">S/ 0.00</td>
            <td class="px-3 py-2 text-center"><button type="button" class="btn-delete-line text-red-500 hover:text-red-700 ${hideDeleteClass}"><i data-lucide="x-circle" class="w-5 h-5"></i></button></td>
        `;
        container.appendChild(row);
        if (window.lucide) window.lucide.createIcons();
        this.calculateRowSubtotal(row);
    },

    calculateRowSubtotal(row) {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const subtotal = qty * price;
        row.querySelector('.item-subtotal').textContent = `S/ ${subtotal.toFixed(2)}`;
        return subtotal;
    },

    calculateTotal() {
        const rows = document.querySelectorAll('.item-row');
        let total = 0;
        rows.forEach(row => { total += this.calculateRowSubtotal(row); });
        const displayTotal = document.getElementById('display-total');
        if (displayTotal) displayTotal.textContent = `S/ ${total.toFixed(2)}`;
        return total;
    },

    gatherFormData() {
        const clientId = document.getElementById('client-id-hidden').value;
        const clientName = document.getElementById('client-search').value;
        const rows = document.querySelectorAll('.item-row');
        const items = []; let total = 0;
        rows.forEach(row => {
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const subtotal = qty * price;
            items.push({ producto: row.querySelector('.item-name').value, cantidad: qty, specs: row.querySelector('.item-specs').value, precio: price, subtotal: subtotal });
            total += subtotal;
        });
        return { cliente_id: clientId, cliente_nombre: clientName, notas: document.getElementById('notas_internas').value, items: items, total: total };
    },

    setupEvents(currentId) {
        const form = document.getElementById('order-form');
        if (form) {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            this.setupClientSearch();

            newForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = this.gatherFormData();
                if (!data.cliente_id) { window.UI.showNotification('Error', 'Seleccione un cliente.'); return; }
                if (data.items.length === 0) { window.UI.showNotification('Error', 'Agregue productos.'); return; }

                if (currentId) {
                    await OrdenDetalleService.updateOrder(currentId, data);
                    window.UI.showNotification('Guardado', 'Cambios guardados correctamente.');
                } else {
                    const res = await OrdenDetalleService.createOrder(data);
                    if (res.success) {
                        window.UI.showNotification('Creado', 'Cotización creada.');
                        setTimeout(() => window.location.hash = `#/orden-detalle/${res.id}/view`, 500);
                    }
                }
            });

            newForm.querySelector('#btn-add-line')?.addEventListener('click', () => { this.addProductRow(); this.calculateTotal(); });
            document.getElementById('product-lines-container')?.addEventListener('click', (e) => {
                if(e.target.closest('.btn-delete-line')) { e.target.closest('tr').remove(); this.calculateTotal(); }
            });
            document.getElementById('product-lines-container')?.addEventListener('input', (e) => {
                if (e.target.matches('.item-qty, .item-price')) this.calculateTotal();
            });
        }

        const bindBtn = (id, handler) => {
            const btn = document.getElementById(id);
            if(btn) {
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.addEventListener('click', handler);
            }
        };

        bindBtn('btn-cancel-nav', () => window.location.hash = '#/ordenes');

        bindBtn('btn-convert-ot', async () => {
            const performConversion = async (targetId) => {
                window.UI.showConfirmModal('Confirmar', '¿Generar Orden de Trabajo?', 'Sí, Generar', async () => {
                    const res = await OrdenDetalleService.convertToOT(targetId);
                    if (res.success) {
                        window.UI.showNotification('Éxito', `OT Generada: ${res.otId}`);
                        this.init([targetId, 'view']);
                    }
                });
            };

            if (!currentId) {
                const data = this.gatherFormData();
                if (!data.cliente_id) return window.UI.showNotification('Error', 'Seleccione cliente.');
                const saveRes = await OrdenDetalleService.createOrder(data);
                if (saveRes.success) performConversion(saveRes.id);
            } else {
                performConversion(currentId);
            }
        });

        bindBtn('btn-reject-quote', async () => {
             if (!currentId) return;
             await OrdenDetalleService.rejectQuote(currentId);
             window.UI.showNotification('Rechazada', 'Cotización archivada.');
             window.location.hash = '#/ordenes';
        });

        bindBtn('btn-generate-invoice', () => {
            const docType = this.clientType === 'NATURAL' ? 'BOLETA' : 'FACTURA';
            const docName = this.clientType === 'NATURAL' ? 'Boleta de Venta' : 'Factura Electrónica';
            
            window.UI.showConfirmModal(
                `Emitir ${docName}`,
                `¿Está seguro de generar una <b>${docName}</b> para esta Orden? Esta acción enviará el documento a SUNAT.`,
                `Sí, Emitir ${docType}`,
                () => {
                    this.processInvoiceGeneration(docType);
                }
            );
        });
    }
};