/**
 * modules/prensa/js/services/local.db.js
 */
const DB_KEY = 'crm_orders'; 

export const LocalDB = {
    initMockData() {
        const existing = localStorage.getItem(DB_KEY);
        if (!existing || existing === '[]') {
            const mockData = [
                {
                    id: '1235', 
                    ot_id: 'OT-1235', 
                    cliente_nombre: 'Editorial Futuro EIRL',
                    items: [{ producto: '500 Libros Tapa Dura', specs: 'Tapa Dura' }],
                    // ASIGNADO A LUIS TORRES (u3)
                    asignado_prensa: 'u3',
                    asignado_nombre_prensa: 'Luis Torres',
                    estado: 'Asignada a Prensa',
                    fecha_asignacion_prensa: '2025-11-18 10:00:00'
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