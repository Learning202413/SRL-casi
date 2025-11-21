import { PostPrensaColaGeneralService } from '../services/cola-general.service.js';

export const ColaGeneralController = {
    init: async function() {
        console.log("ColaGeneralController inicializado.");
        await this.loadTasks();
        this.setupEvents();
    },

    async loadTasks() {
        const tableBody = document.getElementById('tasks-table-body');
        if (!tableBody) return;

        const tasks = await PostPrensaColaGeneralService.getIncomingTasks();
        tableBody.innerHTML = '';

        if (tasks.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">No hay tareas pendientes de Prensa.</td></tr>`;
            return;
        }

        tasks.forEach(task => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition duration-150';
            row.dataset.otId = task.id;

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${task.ot_id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${task.cliente}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">${task.producto}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Nuevo</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button class="btn-take-task flex items-center justify-center mx-auto px-3 py-1 text-sm bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 transition">
                        <i data-lucide="plus-circle" class="w-4 h-4 mr-1"></i> Tomar
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        if (window.lucide) window.lucide.createIcons();
    },

    setupEvents() {
        const tableBody = document.getElementById('tasks-table-body');
        if (tableBody) {
            tableBody.addEventListener('click', async (e) => {
                const takeButton = e.target.closest('.btn-take-task');
                if (takeButton) {
                    const row = takeButton.closest('tr');
                    const dbId = row.dataset.otId;
                    
                    takeButton.disabled = true;
                    takeButton.textContent = '...';

                    const success = await PostPrensaColaGeneralService.assignTaskToMe(dbId);

                    if (success) {
                        if(window.UI) window.UI.showNotification('Tarea Asignada', `Movida a Mis Tareas.`);
                        row.remove();
                        if (tableBody.children.length === 0) {
                            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">No hay tareas pendientes.</td></tr>`;
                        }
                    }
                }
            });
        }
    }
};