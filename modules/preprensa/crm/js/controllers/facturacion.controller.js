/**
 * js/controllers/facturacion.controller.js
 * (Solo la función getInvoiceTemplate actualizada para referencia, el resto sigue igual)
 */
import { FacturacionService } from '../services/facturacion.service.js';

export const FacturacionController = {
    // ... (El resto del código init, setupEvents, loadAndRender se mantiene igual) ...
    currentDocuments: [],

    init: async function() {
        // ... (igual que antes)
        console.log("FacturacionController Inicializado.");
        this.setupEvents();
        await this.loadAndRender();
    },

    setupEvents() {
        // ... (igual que antes)
        const filterButton = document.getElementById('filter-button');
        const filterPanel = document.getElementById('filter-panel');
        if (filterButton && filterPanel) filterButton.onclick = () => filterPanel.classList.toggle('hidden');
        document.getElementById('search-input')?.addEventListener('input', () => this.loadAndRender());
        
        const tbody = document.getElementById('documents-table-body');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-download');
                if (btn) {
                    const docId = btn.dataset.id;
                    const originalContent = btn.innerHTML;
                    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>`;
                    if(window.lucide) window.lucide.createIcons();
                    this.downloadPDFDirectly(docId).finally(() => {
                        btn.innerHTML = originalContent;
                        if(window.lucide) window.lucide.createIcons();
                    });
                }
            });
        }
    },

    async loadAndRender() {
        // ... (igual que antes)
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        this.currentDocuments = await FacturacionService.getAllDocuments();
        const filtered = this.currentDocuments.filter(d => 
            d.numero.toLowerCase().includes(searchTerm) ||
            d.cliente_nombre.toLowerCase().includes(searchTerm) ||
            d.ot_id.toLowerCase().includes(searchTerm)
        );
        this.renderTable(filtered);
        this.updatePagination(filtered.length);
    },

    renderTable(documents) {
        // ... (igual que antes, renderiza la tabla)
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
                        <button class="btn-download text-red-600 hover:text-red-800 transition p-1 rounded-full hover:bg-red-50" title="Descargar PDF" data-id="${doc.id}">
                            <i data-lucide="file-down" class="w-5 h-5"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        if (window.lucide) window.lucide.createIcons();
    },

    updatePagination(count) {
        const totalEl = document.getElementById('total-count'); if(totalEl) totalEl.textContent = count;
        const startEl = document.getElementById('start-count'); if(startEl) startEl.textContent = count > 0 ? 1 : 0;
        const endEl = document.getElementById('end-count'); if(endEl) endEl.textContent = count;
    },

    async downloadPDFDirectly(docId) {
        if (!window.html2pdf) await this.loadHtml2PdfLibrary();
        const doc = this.currentDocuments.find(d => d.id === docId);
        if (!doc) { alert("Error: No se encontró el documento."); return; }

        const element = document.createElement('div');
        element.innerHTML = this.getInvoiceTemplate(doc);
        const opt = {
            margin: 10, filename: `${doc.numero}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        try { await html2pdf().set(opt).from(element).save(); } 
        catch (error) { console.error("Error PDF:", error); alert("Error al generar PDF."); }
    },

    loadHtml2PdfLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    /**
     * PLANTILLA DE FACTURA (Visualización)
     */
    getInvoiceTemplate(doc) {
        const itemsHtml = doc.items ? doc.items.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.descripcion || item.producto || 'Servicio'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.cantidad || 1}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">S/ ${parseFloat(item.precio || item.precio_unitario || 0).toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">S/ ${parseFloat(item.subtotal || item.total || 0).toFixed(2)}</td>
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
                        <div style="font-size: 20px; font-weight: bold; color: #555;">${doc.tipo === 'FACTURA' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA'}</div>
                        <div style="font-size: 18px; color: #c0392b; margin-top: 5px;">${doc.numero}</div>
                        <p style="margin-top: 5px; font-size: 13px;">Fecha: ${doc.fecha_emision}</p>
                    </div>
                </div>

                <div style="margin-bottom: 30px; background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 14px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 4px 0; width: 80px;"><strong>Cliente:</strong></td>
                            <td style="padding: 4px 0;">${doc.cliente_nombre}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;"><strong>${doc.cliente_doc.length === 11 ? 'RUC' : 'DNI'}:</strong></td>
                            <td style="padding: 4px 0;">${doc.cliente_doc}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;"><strong>Dirección:</strong></td>
                            <td style="padding: 4px 0;">${doc.cliente_direccion || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;"><strong>Email:</strong></td>
                            <td style="padding: 4px 0;">${doc.cliente_email || '-'}</td>
                        </tr>
                    </table>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
                    <thead>
                        <tr style="background: #333; color: white;">
                            <th style="padding: 10px; text-align: left;">Descripción</th>
                            <th style="padding: 10px; text-align: right;">Cant.</th>
                            <th style="padding: 10px; text-align: right;">P. Unit</th>
                            <th style="padding: 10px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div style="float: right; width: 250px; font-size: 14px;">
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span>Subtotal:</span> <span>S/ ${doc.subtotal}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span>IGV (18%):</span> <span>S/ ${doc.igv}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #333; font-weight: bold; font-size: 16px;">
                        <span>TOTAL:</span> <span>S/ ${doc.total}</span>
                    </div>
                </div>
                <div style="clear: both;"></div>
                <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px;">
                    Representación impresa del Comprobante Electrónico.<br>
                    Gracias por su preferencia.
                </div>
            </div>
        `;
    }
};