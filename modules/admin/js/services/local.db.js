/**
 * js/services/local.db.js
 * Servicio de persistencia local usando localStorage.
 * Contiene helpers comunes y la función de logs global.
 */

// --- Helpers de LocalStorage ---
export const getStorage = (key, seed) => {
    const data = localStorage.getItem(key);
    if (!data) {
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
    
    let currentUser = 'Sistema/Anon';

    try {
        // 1. Intentar leer sesión de la demo local (erp_session)
        const localSession = localStorage.getItem('erp_session');
        if (localSession) {
            const user = JSON.parse(localSession);
            currentUser = user.email || user.name;
        } 
        // 2. Fallback: Intentar leer sesión de Supabase (si existiera)
        else {
            const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
            if (key) {
                const session = JSON.parse(localStorage.getItem(key));
                if (session && session.user && session.user.email) {
                    currentUser = session.user.email;
                }
            }
        }
    } catch (e) {
        console.warn("No se pudo recuperar el usuario para el log", e);
    }

    const newLog = {
        id: Date.now(),
        action,
        details,
        user: currentUser,
        timestamp: new Date().toLocaleString('es-PE')
    };
    
    logs.unshift(newLog);
    setStorage('admin_logs', logs);
    console.log(`[AUDIT] ${action}: ${details}`);
};

export const dbBase = {
    getLogs() {
        return getStorage('admin_logs', []);
    },
    getStorage,
    setStorage,
    log
};