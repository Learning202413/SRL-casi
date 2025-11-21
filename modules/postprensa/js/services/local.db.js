/**
 * modules/postprensa/js/services/local.db.js
 */
const DB_KEY = 'crm_orders'; 

export const LocalDB = {
    initMockData() {
        const existing = localStorage.getItem(DB_KEY);
        if (!existing || existing === '[]') {
            const mockData = [
                {
                    id: '1002', 
                    ot_id: 'OT-1002', 
                    cliente_nombre: 'Restaurante El Gusto',
                    items: [{ producto: '5000 Individuales', specs: 'Kraft 120g' }],
                    // ASIGNADO A MARIA PAZ (u4)
                    asignado_postprensa: 'u4',
                    asignado_nombre_postprensa: 'Maria Paz',
                    estado: 'Pendiente', 
                    avance_postprensa: { paso1: false, paso2: false, paso3: false }
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