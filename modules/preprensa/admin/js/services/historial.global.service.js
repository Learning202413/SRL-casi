/**
 * js/services/historial.global.service.js
 * Servicio para gestionar la obtención de logs globales.
 */
import { dbBase } from './local.db.js';

export const HistorialGlobalService = {
    async getLogs() {
        return new Promise(resolve => {
            const logs = dbBase.getLogs();
            setTimeout(() => resolve(logs), 100);
        });
    }
};