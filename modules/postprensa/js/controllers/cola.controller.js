import { PostPrensaColaService } from '../services/cola.service.js';

// Helper local para obtener el nombre del usuario actual para la UI
const getUsername = () => {
    const session = localStorage.getItem('erp_session');
    const user = session ? JSON.parse(session) : null;
    return user ? user.name : '[Usuario No Logueado]';
};

export const ColaController = {
    init: async function() {
        console.log("ColaController (Mis Tareas) inicializado.");
        
        // Mostrar el nombre del usuario logueado en el encabezado
        const userNameEl = document.getElementById('current-user-name');
        if (userNameEl) userNameEl.textContent = getUsername();
        
        await this.loadMyTasks();
        // Exponer para el onclick del HTML inyectado
        window.startPostPrensaTask = this.startTask.bind(this);
    },

    async loadMyTasks() {
        const tasks = await PostPrensaColaService.getMyTasks();
        const tbody = document.getElementById('tasks-table-body');
        if(!tbody) return;

        tbody.innerHTML = '';

        if (tasks.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">No tienes tareas asignadas.</td></tr>`;
            return;
        }

        tasks.forEach(task => {
            let actionHtml = '';
            if (task.estado === 'Pendiente') {
                actionHtml = `
                    <button onclick="window.startPostPrensaTask('${task.id}')" class="flex items-center justify-center mx-auto px-3 py-1 text-sm bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition">
                        <i data-lucide="play" class="w-4 h-4 mr-1"></i> Procesar
                    </button>
                `;
            } else {
                actionHtml = `
                    <a href="#/calidad/${task.id}" class="flex items-center justify-center mx-auto px-3 py-1 text-sm bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:bg-green-700 transition">
                        <i data-lucide="arrow-right-circle" class="w-4 h-4 mr-1"></i> Continuar
                    </a>
                `;
            }

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50';
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${task.ot_id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${task.cliente}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${task.producto}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">${task.estacion}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.badgeColor}">${task.estado}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });
        if (window.lucide) window.lucide.createIcons();
    },

    async startTask(id) {
        await PostPrensaColaService.startProcessing(id);
        await this.loadMyTasks();
    }
};