/**
 * js/services/facturacion.service.js
 * Servicio actualizado: Usa los datos YA GUARDADOS del cliente (Dirección completa + Email).
 */
import { LocalDB } from './local.db.js';
import { ClientesService } from './clientes.service.js';

const getTimestamp = () => new Date().toLocaleString('es-PE', { 
    hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit', 
    day: '2-digit', month: '2-digit', year: 'numeric'
});

export const FacturacionService = {
    async getAllDocuments() {
        return new Promise(resolve => {
            const docs = LocalDB.getAllInvoices();
            docs.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
            setTimeout(() => resolve(docs), 200);
        });
    },

    async generateDocumentFromOT(otId, tipoDoc) {
        const ot = LocalDB.getById(otId);
        if (!ot) return { success: false, message: 'Orden no encontrada' };

        const existingDocs = LocalDB.getAllInvoices();
        const alreadyBilled = existingDocs.find(d => d.ot_id === ot.ot_id);
        if (alreadyBilled) {
            return { success: false, message: `La OT ${ot.ot_id} ya tiene un documento generado.` };
        }

        // 1. Recuperamos el cliente desde la BD Local (donde ya están guardados todos los datos de la API y el Form)
        const clientData = await ClientesService.getClientById(ot.cliente_id);
        
        // 2. Preparamos los datos
        const realDocumento = clientData ? clientData.ruc : '00000000';
        const realEmail = clientData ? (clientData.email || '-') : '-';

        // 3. Construimos la DIRECCIÓN FISCAL COMPLETA
        // Concatenamos: Dirección + Distrito + Provincia + Departamento (si existen)
        let fullAddress = '-';
        if (clientData) {
            const parts = [
                clientData.direccion,
                clientData.distrito,
                clientData.provincia,
                clientData.departamento
            ].filter(Boolean); // Filtra los vacíos o nulos

            if (parts.length > 0) {
                fullAddress = parts.join(' - ').toUpperCase();
            }
        }

        // 4. Correlativo
        const prefix = tipoDoc === 'FACTURA' ? 'F001' : 'B001';
        const count = existingDocs.filter(d => d.tipo === tipoDoc).length + 1;
        const number = `${prefix}-${String(count).padStart(6, '0')}`;
        
        // 5. Cálculos
        const totalStr = ot.total || "0";
        const totalFinal = parseFloat(totalStr);
        const subtotal = totalFinal / 1.18;
        const igv = totalFinal - subtotal;

        // 6. Guardamos la Factura con los datos listos
        const newInvoice = {
            id: `DOC-${Date.now()}`,
            ot_id: ot.ot_id,
            tipo: tipoDoc,
            numero: number,
            cliente_nombre: ot.cliente_nombre,
            cliente_doc: realDocumento,
            cliente_direccion: fullAddress, // Dirección ya concatenada
            cliente_email: realEmail,       // Email del cliente
            fecha_emision: getTimestamp(),
            fecha_creacion: new Date().toISOString(),
            subtotal: subtotal.toFixed(2),
            igv: igv.toFixed(2),
            total: totalFinal.toFixed(2),
            items: ot.items || [],
            estado_sunat: 'ACEPTADO' 
        };

        LocalDB.saveInvoice(newInvoice);
        LocalDB.update(ot.id, { estado_facturacion: 'Facturado' });

        return { success: true, message: `Documento ${number} generado correctamente.` };
    }
};