/**
 * js/services/users.db.js
 * Definición de usuarios y roles.
 * ACTUALIZADO: Ahora registra logs de EDICIÓN y ELIMINACIÓN.
 */
import { getStorage, setStorage, log } from './local.db.js';

const SEED_USERS = [
    { id: 'u1', name: 'Carlos Ruiz', email: 'carlos.ruiz@impresos.com', role: 'Diseñador (Pre-Prensa)', status: 'Online' },
    { id: 'u2', name: 'Elena Ríos', email: 'elena.rios@impresos.com', role: 'Diseñador (Pre-Prensa)', status: 'Offline' },
    { id: 'u3', name: 'Luis Torres', email: 'luis.torres@impresos.com', role: 'Operador (Prensa)', status: 'Online' },
    { id: 'u4', name: 'Maria Paz', email: 'maria.paz@impresos.com', role: 'Operador (Post-Prensa)', status: 'Online' },
    { id: 'u5', name: 'Ana García', email: 'ana.garcia@impresos.com', role: 'Vendedor (CRM)', status: 'Online' },
    { id: 'u6', name: 'Gerente General', email: 'gerencia@impresos.com', role: 'Admin (Gerente)', status: 'Online' },
];

export const usersDB = {
    async getUsers() {
        return getStorage('admin_users', SEED_USERS);
    },
    
    async addUser(user) {
        const users = await this.getUsers();
        
        // Validación anti-duplicados
        const exists = users.some(u => u.email.trim().toLowerCase() === user.email.trim().toLowerCase());
        if (exists) return { success: false, message: 'El correo ya está registrado.' };

        const newUser = { ...user, id: `u${Date.now()}`, status: user.status || 'Offline' };
        users.push(newUser);
        setStorage('admin_users', users);
        
        log('USUARIO_CREADO', `Se creó el usuario ${newUser.name} (${newUser.role})`);
        return { success: true, data: newUser };
    },

    async updateUser(id, updates) {
        let users = await this.getUsers();
        const index = users.findIndex(u => u.id === id);
        
        if (index !== -1) {
            const oldName = users[index].name;
            users[index] = { ...users[index], ...updates };
            setStorage('admin_users', users);
            
            // [LOG NUEVO] Registro de edición
            log('USUARIO_EDITADO', `Se modificaron datos de ${oldName}`);
            return { success: true };
        }
        return { success: false };
    },

    async deleteUser(id) {
        let users = await this.getUsers();
        const user = users.find(u => u.id === id);
        
        if (user) {
            users = users.filter(u => u.id !== id);
            setStorage('admin_users', users);
            
            // [LOG NUEVO] Registro de eliminación
            log('USUARIO_ELIMINADO', `Se eliminó al usuario ${user.name} (${user.role})`);
            return { success: true };
        }
        return { success: false };
    },

    async getActiveUserCount() {
        const users = await this.getUsers();
        return users.filter(u => u.status === 'Online').length;
    }
};