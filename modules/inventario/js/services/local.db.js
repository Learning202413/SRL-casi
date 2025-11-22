/**
 * js/services/local.db.js
 * Servicio de persistencia local usando localStorage.
 * Contiene helpers comunes y la función de logs global.
 */

// --- Helpers de LocalStorage ---
export const getStorage = (key, seed) => {
    const data = localStorage.getItem(key);
    if (!data) {
        // Si no hay datos, guardamos la semilla inicial y la devolvemos
        localStorage.setItem(key, JSON.stringify(seed));
        return seed;
    }
    return JSON.parse(data);
};

export const setStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};


// --- LOGS / HISTORIAL (Compartido) ---
// Esta función se usa en todo el sistema para registrar eventos de auditoría
export const log = (action, details) => {
    const logs = getStorage('admin_logs', []);
    const newLog = {
        id: Date.now(),
        action,
        details,
        timestamp: new Date().toLocaleString()
    };
    logs.unshift(newLog); // Agregar al inicio para ver el más reciente primero
    setStorage('admin_logs', logs);
};

// Se exportan las funciones de log y helpers para que sean usadas por los demás servicios
export const dbBase = {
    getLogs() {
        return getStorage('admin_logs', []);
    },
    getStorage,
    setStorage,
    log
};