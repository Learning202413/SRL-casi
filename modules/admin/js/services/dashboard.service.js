/**
 * js/services/dashboard.service.js
 * Servicio que agrega datos de varios dominios (Producción, Usuarios) 
 * para el Dashboard Gerencial.
 */
import { productionDB } from './production.db.js';
import { usersDB } from './users.db.js';

export const DashboardService = {
    
    async getKpiStats() {
        const productionStats = await productionDB.getDashboardStats();
        const activeUserCount = await usersDB.getActiveUserCount();

        return {
            pendingOTs: productionStats.pendingOTs,
            totalOTs: productionStats.totalOTs,
            activeUsers: activeUserCount
        };
    },

    async getUsersStatus() {
        return await usersDB.getUsers();
    },

    // --- NUEVO MÉTODO ---
    async getTrendData() {
        return await productionDB.getProductionTrend();
    }
};