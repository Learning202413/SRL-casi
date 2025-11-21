/**
 * js/services/historial.orden.service.js
 * Servicio para la lógica de negocio de la trazabilidad.
 * VERSIÓN FINAL: Distingue Autores (Admin vs Operador) en las 3 fases.
 */
import { dbBase } from './local.db.js';

export const HistorialOrdenService = {

    async getTraceabilityData(query) {
        return new Promise(resolve => {
            const allOrders = dbBase.getStorage('crm_orders', []);
            const ot = allOrders.find(o => 
                (o.ot_id && o.ot_id.toLowerCase() === query.toLowerCase()) || 
                (o.id === query)
            );

            if (!ot) {
                resolve(null);
                return;
            }

            const events = this.buildTimelineEvents(ot);
            resolve({ ot, events });
        });
    },

    buildTimelineEvents(ot) {
        const events = [];
        
        // 1. Obtener logs para identificar al autor de la acción
        const logs = dbBase.getLogs();
        const otLogs = logs.filter(l => l.details && l.details.includes(ot.ot_id));

        /**
         * Helper Inteligente: Determina Quién hizo la acción y Qué título poner.
         * @param {string} phaseName - Nombre de la fase (ej: "DISEÑO", "PRENSA", "ACABADOS")
         * @param {string} logKey - Palabra clave para buscar en logs (ej: "Diseño")
         * @param {string} logExclude - Palabra a excluir en logs (ej: "Pendiente" vs "Diseño Pendiente")
         * @param {string} workerName - Nombre del operador asignado en la OT
         * @param {string} otDate - Fecha registrada en la OT (puede ser nula si fue asignado por admin)
         */
        const getPhaseEventData = (phaseName, logKey, logExclude, workerName, otDate) => {
            // Buscar si hay un log de Admin para esta fase
            const adminLog = otLogs.find(l => {
                const det = l.details.toLowerCase();
                const matchKey = det.includes(logKey.toLowerCase());
                const matchExclude = logExclude ? !det.includes(logExclude.toLowerCase()) : true;
                return l.action === 'OT_ASIGNADA' && matchKey && matchExclude;
            });

            if (adminLog) {
                // CASO PUSH: El Administrador asignó la tarea
                return {
                    title: `ASIGNADO A ${phaseName} (POR ADMIN)`,
                    user: adminLog.user, // El nombre/email del Admin que lo hizo
                    date: adminLog.timestamp,
                    color: 'purple',
                    icon: 'user-plus',
                    details: `Asignado a: ${workerName || 'Sin nombre'}`
                };
            } else {
                // CASO PULL: El Operador tomó la tarea
                // Si no hay fecha en la OT ni log, no ha ocurrido el evento
                if (!otDate) return null; 
                
                return {
                    title: `TOMADO POR OPERADOR (${phaseName})`,
                    user: workerName || 'Operador', // El nombre del Operador que lo tomó
                    date: otDate,
                    color: 'indigo',
                    icon: 'hand',
                    details: null
                };
            }
        };

        // Helper genérico para agregar eventos
        const addEvent = (title, user, rawDate, icon, color, details = null) => {
            if (rawDate) {
                events.push({
                    title,
                    user: user || 'Sistema',
                    time: this.formatDate(rawDate),
                    rawTime: rawDate,
                    icon,
                    color,
                    details
                });
            }
        };

        // ==========================================
        // CONSTRUCCIÓN DE LA LÍNEA DE TIEMPO
        // ==========================================

        // --- 1. CRM & VENTAS ---
        addEvent('ORDEN CREADA (CRM)', 'Ventas / Sistema', ot.fecha_creacion, 'file-plus', 'blue');

        // --- 2. PRE-PRENSA (DISEÑO) ---
        // Lógica inteligente para la entrada a Diseño
        const evtDiseno = getPhaseEventData('DISEÑO', 'Diseño', null, ot.asignado_nombre_preprensa, ot.fecha_asignacion);
        if (evtDiseno) {
            addEvent(evtDiseno.title, evtDiseno.user, evtDiseno.date, evtDiseno.icon, evtDiseno.color, evtDiseno.details);
        }
        
        addEvent('DISEÑO EN PROCESO', ot.asignado_nombre_preprensa || 'Diseñador', ot.fecha_inicio_diseno, 'monitor', 'indigo');
        addEvent('DISEÑO ENVIADO AL CLIENTE', ot.asignado_nombre_preprensa || 'Diseñador', ot.fecha_envio_aprobacion, 'send', 'yellow', 'Esperando aprobación');
        addEvent('DISEÑO APROBADO / PASE A PRENSA', 'Cliente / Pre-Prensa', ot.fecha_pase_prensa, 'check-circle-2', 'green');

        // --- 3. PRENSA (IMPRESIÓN) ---
        // Lógica inteligente para la entrada a Prensa
        const evtPrensa = getPhaseEventData('PRENSA', 'Prensa', null, ot.asignado_nombre_prensa, ot.fecha_asignacion_prensa);
        if (evtPrensa) {
            addEvent(evtPrensa.title, evtPrensa.user, evtPrensa.date, evtPrensa.icon, evtPrensa.color, evtPrensa.details);
        }

        addEvent('PREPARACIÓN DE MÁQUINA', ot.asignado_nombre_prensa || 'Operador', ot.fecha_inicio_prep, 'settings-2', 'purple', 'Ajuste de placas y tintas');
        addEvent('IMPRESIÓN INICIADA', ot.asignado_nombre_prensa || 'Operador', ot.fecha_inicio_print, 'loader-2', 'purple');
        
        if (ot.fecha_fin_prensa) {
            const det = `Consumo: ${ot.consumo_papel || 0}, Desperdicio: ${ot.desperdicio_papel || 0}`;
            addEvent('IMPRESIÓN FINALIZADA', ot.asignado_nombre_prensa || 'Operador', ot.fecha_fin_prensa, 'layers', 'purple', det);
        }

        // --- 4. POST-PRENSA (ACABADOS) ---
        // Lógica inteligente para la entrada a Acabados (Busca "Pendiente" excluyendo "Diseño")
        const evtPost = getPhaseEventData('ACABADOS', 'Pendiente', 'Diseño', ot.asignado_nombre_postprensa, ot.fecha_asignacion_postprensa);
        if (evtPost) {
            addEvent(evtPost.title, evtPost.user, evtPost.date, evtPost.icon, 'orange', evtPost.details);
        }
        
        addEvent('ACABADOS EN PROCESO', ot.asignado_nombre_postprensa || 'Operador', ot.fecha_inicio_acabados, 'hammer', 'orange');
        addEvent('ORDEN COMPLETADA Y EMPAQUETADA', 'Control de Calidad', ot.fecha_fin_proceso, 'package-check', 'green');

        // --- 5. FACTURACIÓN ---
        if (ot.estado_facturacion === 'Facturado') {
             const invoices = dbBase.getStorage('crm_invoices', []);
             const inv = invoices.find(i => i.ot_id === ot.ot_id);
             if (inv) {
                addEvent(`DOCUMENTO EMITIDO (${inv.numero})`, 'Administración / CRM', inv.fecha_emision, 'receipt', 'gray');
             }
        }

        // Ordenar cronológicamente
        return events.sort((a, b) => this.parseDateValue(a.rawTime) - this.parseDateValue(b.rawTime));
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        const dateObj = this.parseDateValue(dateStr);
        if (!dateObj || isNaN(dateObj.getTime())) return dateStr; 

        return new Intl.DateTimeFormat('es-PE', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: true // Formato AM/PM
        }).format(dateObj);
    },

    parseDateValue(dateStr) {
        if (!dateStr) return 0;
        if (dateStr.includes('-') && dateStr.includes('T')) return new Date(dateStr);
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return new Date(dateStr + 'T00:00:00');

        try {
            let cleanStr = dateStr.replace(',', '').trim();
            let parts = cleanStr.split(' ');
            let datePart = parts[0]; 
            let timePart = parts[1] || '00:00:00';
            let meridiem = parts.slice(2).join('').toLowerCase();

            const [day, month, year] = datePart.split('/').map(Number);
            let [hours, minutes, seconds] = timePart.split(':').map(Number);

            if (!year || !month || !day) return new Date(dateStr);

            if (meridiem.includes('p') && hours < 12) hours += 12;
            if (meridiem.includes('a') && hours === 12) hours = 0;

            return new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
        } catch (e) {
            return new Date(0);
        }
    }
};