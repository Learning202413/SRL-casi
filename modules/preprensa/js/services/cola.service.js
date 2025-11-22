import { LocalDB } from './local.db.js';

const getCurrentUser = () => {
    const session = localStorage.getItem('erp_session');
    return session ? JSON.parse(session) : null;
};

export const ColaService = {
    async getMyTasks() {
        return new Promise(resolve => {
            const user = getCurrentUser();
            if (!user) { resolve([]); return; } // Si no hay login, lista vacía

            const all = LocalDB.getAll();
            
            // FILTRO: Solo tareas donde 'asignado_a' coincida con MI ID
            const myTasks = all.filter(t => 
                t.asignado_a === user.id && 
                (
                    t.estado === 'Diseño Pendiente' || 
                    t.estado === 'En diseño' || 
                    t.estado === 'En Aprobación de Cliente' || 
                    t.estado === 'Diseño Aprobado' || 
                    t.estado === 'Cambios Solicitados'
                )
            );

            const viewData = myTasks.map(order => ({
                id: order.id, ot_id: order.ot_id, cliente: order.cliente_nombre,
                producto: order.items ? order.items[0].producto : 'Varios',
                fecha_creacion: order.fecha_creacion,
                estado: order.estado,
                badgeColor: this.getBadgeColor(order.estado)
            }));
            setTimeout(() => resolve(viewData), 200);
        });
    },
    // ... updateStatus y getBadgeColor se mantienen igual ...
    async updateStatus(id, newStatus) {
        const now = new Date().toLocaleString();
        let updates = { estado: newStatus, ultima_actualizacion: now };
        if (newStatus === 'En diseño') updates.fecha_inicio_diseno = now; 
        return LocalDB.update(id, updates);
    },
    getBadgeColor(estado) {
        if (estado === 'En diseño') return 'bg-indigo-100 text-indigo-800';
        if (estado === 'En Aprobación de Cliente') return 'bg-yellow-100 text-yellow-800';
        if (estado === 'Diseño Aprobado') return 'bg-green-100 text-green-800';
        return 'bg-blue-100 text-blue-800'; 
    }
};