import { LocalDB } from './local.db.js'; 

const getCurrentUser = () => {
    const session = localStorage.getItem('erp_session');
    return session ? JSON.parse(session) : { id: 'anon', name: 'Anónimo' };
};

export const PostPrensaColaGeneralService = {
    async getIncomingTasks() {
        return new Promise(resolve => {
            const all = LocalDB.getAll();
            // Filtro: 'En Post-Prensa' SIN dueño
            const incoming = all.filter(t => t.estado === 'En Post-Prensa' && !t.asignado_postprensa);

            const viewData = incoming.map(order => ({
                id: order.id, ot_id: order.ot_id, cliente: order.cliente_nombre,
                producto: order.items ? order.items[0].producto : 'Varios',
                estacion: 'Acabados Generales', 
                estado: 'Nuevo' 
            }));
            setTimeout(() => resolve(viewData), 200);
        });
    },

    async assignTaskToMe(id) {
        return new Promise(resolve => {
            const user = getCurrentUser();
            const now = new Date().toLocaleString();
            
            // AUTO-ASIGNACIÓN: Guarda en 'asignado_postprensa'
            // IMPORTANTE: Cambia estado a 'Pendiente' que es el inicial de Post-Prensa personal
            const success = LocalDB.update(id, { 
                estado: 'Pendiente', 
                asignado_postprensa: user.id,
                asignado_nombre_postprensa: user.name,
                fecha_asignacion_postprensa: now,
                avance_postprensa: { paso1: false, paso2: false, paso3: false }
            });
            setTimeout(() => resolve(success), 300);
        });
    }
};