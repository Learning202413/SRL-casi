/**
 * js/services/facturacion.service.js
 * Servicio para gestionar la creación y lectura de documentos fiscales.
 */
import { LocalDB } from './local.db.js';

const getTimestamp = () => new Date().toLocaleString('es-PE', { 
    hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit', 
    day: '2-digit', month: '2-digit', year: 'numeric'
});

export const FacturacionService = {
    /**
     * Obtiene todos los documentos para listar en la tabla.
     */
    async getAllDocuments() {
        return new Promise(resolve => {
            const docs = LocalDB.getAllInvoices();
            // Ordenar por fecha descendente (más reciente primero)
            docs.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
            setTimeout(() => resolve(docs), 200);
        });
    },

    /**
     * Genera una Factura o Boleta a partir de una OT completada.
     */
    async generateDocumentFromOT(otId, tipoDoc) {
        return new Promise(resolve => {
            const ot = LocalDB.getById(otId);
            if (!ot) {
                resolve({ success: false, message: 'Orden no encontrada' });
                return;
            }

            // 1. Validar si ya existe factura para esta OT
            const existingDocs = LocalDB.getAllInvoices();
            const alreadyBilled = existingDocs.find(d => d.ot_id === ot.ot_id);
            if (alreadyBilled) {
                resolve({ success: false, message: `La OT ${ot.ot_id} ya tiene un documento generado (${alreadyBilled.numero}).` });
                return;
            }

            // 2. Generar correlativo simple (Simulación)
            const prefix = tipoDoc === 'FACTURA' ? 'F001' : 'B001';
            const count = existingDocs.filter(d => d.tipo === tipoDoc).length + 1;
            const number = `${prefix}-${String(count).padStart(6, '0')}`;
            
            // 3. Cálculos
            const totalStr = ot.total || "0";
            const totalFinal = parseFloat(totalStr);
            const subtotal = totalFinal / 1.18;
            const igv = totalFinal - subtotal;

            // 4. Crear Objeto Factura
            const newInvoice = {
                id: `DOC-${Date.now()}`,
                ot_id: ot.ot_id,
                tipo: tipoDoc, // 'FACTURA' o 'BOLETA'
                numero: number,
                cliente_nombre: ot.cliente_nombre,
                cliente_doc: ot.cliente_id || '00000000', // RUC o DNI simulado
                fecha_emision: getTimestamp(),
                fecha_creacion: new Date().toISOString(),
                subtotal: subtotal.toFixed(2),
                igv: igv.toFixed(2),
                total: totalFinal.toFixed(2),
                items: ot.items || [],
                estado_sunat: 'ACEPTADO' 
            };

            // 5. Guardar
            LocalDB.saveInvoice(newInvoice);

            // 6. Actualizar la OT para marcarla como facturada
            LocalDB.update(ot.id, { estado_facturacion: 'Facturado' });

            resolve({ success: true, message: `Documento ${number} generado correctamente.` });
        });
    }
};