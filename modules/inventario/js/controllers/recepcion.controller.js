/**
 * js/controllers/recepcion.controller.js
 * Controlador actualizado: Sin campo Email en el PDF.
 */
import { RecepcionService } from '../services/recepcion.service.js';

export const RecepcionController = {
    currentOC: null,
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
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-gray-500">No hay OCs pendientes.</td></tr>';
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
                        <div class="flex items-center justify-center gap-2">
                            <button class="btn-receive flex items-center px-3 py-1 text-sm color-primary-red text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 transition" data-id="${oc.id}" title="Recibir">
                                <i data-lucide="package-check" class="w-4 h-4 mr-1"></i> Recibir
                            </button>
                            <button class="btn-download text-gray-600 hover:text-gray-800 transition p-1 rounded-full hover:bg-gray-100" title="Descargar OC" data-id="${oc.id}">
                                <i data-lucide="file-down" class="w-5 h-5"></i>
                            </button>
                        </div>
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

    // ============================================================
    // LÓGICA DE DESCARGA PDF
    // ============================================================

    async downloadPDFDirectly(ocId) {
        if (!window.html2pdf) await this.loadHtml2PdfLibrary();

        const response = await RecepcionService.getOCForPDF(ocId);
        if (!response.success) { 
            alert("Error: No se encontró la orden de compra."); 
            return; 
        }
        const data = response.data;

        const element = document.createElement('div');
        element.innerHTML = this.getOCTemplate(data);

        const opt = {
            margin: 10, 
            filename: `${data.numero}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try { 
            await html2pdf().set(opt).from(element).save(); 
        } catch (error) { 
            console.error("Error PDF:", error); 
            alert("Error al generar PDF."); 
        }
    },

    loadHtml2PdfLibrary() {
        return new Promise((resolve, reject) => {
            if (window.html2pdf) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    // --- MODIFICADO: SE ELIMINÓ EL CAMPO EMAIL ---
    getOCTemplate(data) {
        const itemsHtml = data.items ? data.items.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.producto}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.cantidad}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">S/ ${parseFloat(item.precio || 0).toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">S/ ${(parseFloat(item.precio || 0) * parseFloat(item.cantidad)).toFixed(2)}</td>
            </tr>
        `).join('') : '<tr><td colspan="4">Sin detalles</td></tr>';

        return `
            <div style="font-family: Arial, sans-serif; padding: 30px; color: #333; max-width: 800px; background: white;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #c0392b; padding-bottom: 20px;">
                    <div>
                        <h1 style="color: #c0392b; margin: 0; font-size: 24px;">IMPRESOS S.R.L.</h1>
                        <p style="margin: 5px 0; font-size: 14px;">Av. Ferrocarril 781, Huancayo 12001</p>
                        <p style="margin: 5px 0; font-size: 14px; font-weight: bold;">RUC: 20486277069</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 20px; font-weight: bold; color: #555;">ORDEN DE COMPRA</div>
                        <div style="font-size: 18px; color: #c0392b; margin-top: 5px;">${data.numero}</div>
                        <p style="margin-top: 5px; font-size: 13px;">Fecha: ${data.fecha_emision}</p>
                    </div>
                </div>

                <div style="margin-bottom: 30px; background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 14px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 4px 0; width: 100px;"><strong>Proveedor:</strong></td>
                            <td style="padding: 4px 0;">${data.proveedor_nombre}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;"><strong>RUC/DNI:</strong></td>
                            <td style="padding: 4px 0;">${data.proveedor_doc}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;"><strong>Dirección:</strong></td>
                            <td style="padding: 4px 0;">${data.proveedor_direccion}</td>
                        </tr>
                        </table>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
                    <thead>
                        <tr style="background: #333; color: white;">
                            <th style="padding: 10px; text-align: left;">Producto / Descripción</th>
                            <th style="padding: 10px; text-align: center;">Cant.</th>
                            <th style="padding: 10px; text-align: right;">P. Unit</th>
                            <th style="padding: 10px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div style="float: right; width: 250px; font-size: 14px;">
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span>Subtotal:</span> <span>S/ ${data.subtotal}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span>IGV (18%):</span> <span>S/ ${data.igv}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #333; font-weight: bold; font-size: 16px;">
                        <span>TOTAL:</span> <span>S/ ${data.total}</span>
                    </div>
                </div>
                <div style="clear: both;"></div>

                <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px;">
                    Documento generado internamente por Sistema de Inventario.<br>
                    Autorización de Compra.
                </div>
            </div>
        `;
    },

    async handleReceiveSubmit(e) {
        if (e.target.id === 'receive-form') {
            e.preventDefault();
            const form = e.target;
            const itemsReceived = [];
            form.querySelectorAll('tbody tr').forEach(row => {
                itemsReceived.push({
                    producto: row.querySelector('.item-name').textContent,
                    cantidad: row.querySelector('.item-qty').value
                });
            });
            const comments = form.querySelector('textarea').value;

            await RecepcionService.receiveOC(this.currentOC.id, itemsReceived, comments);
            window.UI.hideModal('receive-modal-container');
            window.UI.showNotification('Recepción Exitosa', 'Stock actualizado.');
            this.loadTable();
        }
    },

    setupEvents() {
        const tableBody = document.getElementById('oc-table-body');
        const newTableBody = tableBody.cloneNode(true);
        tableBody.parentNode.replaceChild(newTableBody, tableBody);

        newTableBody.addEventListener('click', async (e) => {
            const btnReceive = e.target.closest('.btn-receive');
            if (btnReceive) {
                const ocId = btnReceive.dataset.id;
                this.currentOC = await RecepcionService.getOCById(ocId);
                if(this.currentOC) {
                    window.UI.showModal('receive-modal-container', 'receive-modal-content');
                    setTimeout(() => this.renderModalItemsInContainer(this.currentOC), 50);
                }
            }

            const btnDownload = e.target.closest('.btn-download');
            if (btnDownload) {
                const ocId = btnDownload.dataset.id;
                const originalContent = btnDownload.innerHTML;
                btnDownload.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>`;
                if(window.lucide) window.lucide.createIcons();

                this.downloadPDFDirectly(ocId).finally(() => {
                    btnDownload.innerHTML = originalContent;
                    if(window.lucide) window.lucide.createIcons();
                });
            }
        });

        const modalContainer = document.getElementById('receive-modal-container');
        if (modalContainer) {
            if (!this._boundHandleReceiveSubmit) {
                this._boundHandleReceiveSubmit = this.handleReceiveSubmit.bind(this);
            }
            modalContainer.removeEventListener('submit', this._boundHandleReceiveSubmit);
            modalContainer.addEventListener('submit', this._boundHandleReceiveSubmit);
        }
    }
};