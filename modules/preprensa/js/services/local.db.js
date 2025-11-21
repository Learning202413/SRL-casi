/**
 * modules/preprensa/js/services/local.db.js
 */
const DB_KEY = 'crm_orders'; 

export const LocalDB = {
    initMockData() {
        const existing = localStorage.getItem(DB_KEY);
        if (!existing || existing === '[]') {
            console.log("Iniciando datos de prueba Pre-Prensa...");
            const mockData = [
                {
                    id: '1234', 
                    ot_id: 'OT-1234', 
                    cliente_nombre: 'Industrias Gráficas S.A.',
                    items: [{ producto: '1000 Revistas A4', specs: 'Couche 150gr.' }],
                    // ASIGNADO A CARLOS RUIZ (u1)
                    asignado_a: 'u1', 
                    asignado_nombre_preprensa: 'Carlos Ruiz',
                    estado: 'Diseño Pendiente', 
                    fecha_creacion: '2025-11-16',
                    pasos_preprensa: { 1: false, 2: false, 3: false, 4: false }
                },
                {
                    id: '1236',
                    ot_id: 'OT-1236',
                    cliente_nombre: 'Cliente Nuevo S.A.',
                    items: [{ producto: '5000 Volantes', specs: 'Bond 90g' }],
                    estado: 'Orden creada',
                    asignado_a: null
                }
            ];
            this.saveAll(mockData);
        }
    },

    getAll() {
        if (!localStorage.getItem(DB_KEY)) this.initMockData();
        const data = localStorage.getItem(DB_KEY);
        return data ? JSON.parse(data) : [];
    },

    getById(id) {
        const all = this.getAll();
        return all.find(item => item.id == id || item.ot_id == id) || null;
    },

    saveAll(data) {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    },

    update(id, updates) {
        const all = this.getAll();
        const index = all.findIndex(item => item.id == id || item.ot_id == id);
        
        if (index !== -1) {
            all[index] = { ...all[index], ...updates };
            this.saveAll(all);
            return true;
        }
        return false;
    }
};
LocalDB.initMockData();