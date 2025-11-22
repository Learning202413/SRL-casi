import { ColaGeneralService } from '../services/cola.general.service.js';

export const ColaGeneralController = {
    init: async function() {
        console.log("ColaGeneralController (Prensa): Buscando OTs listas...");
        await this.loadTasks();
        this.setupEvents();
    },

    async loadTasks() {
        const tasks = await ColaGeneralService.getIncomingTasks();
        this.renderTable(tasks);
    },

    renderTable(tasks) {
        const tbody = document.getElementById('tasks-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (tasks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500 bg-gray-50">No hay tareas pendientes provenientes de Pre-Prensa.</td></tr>';
            return;
        }

        tasks.forEach(task => {
            const row = `
                <tr class="hover:bg-gray-50 transition border-b last:border-0" data-id="${task.id}">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${task.ot_id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${task.cliente}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">${task.maquina}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${task.producto}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">${task.estado}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button class="btn-take-task flex items-center justify-center mx-auto px-3 py-1 text-sm bg-[#E31B23] text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 transition">
                            <i data-lucide="plus-circle" class="w-4 h-4 mr-1"></i> Tomar
                        </button>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        if (window.lucide) window.lucide.createIcons();
    },

    setupEvents() {
        document.getElementById('tasks-table-body')?.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-take-task');
            if (btn) {
                const tr = btn.closest('tr');
                const id = tr.dataset.id;
                
                btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin w-4 h-4"></i>';
                await ColaGeneralService.assignTaskToMe(id);
                
                window.UI.showNotification('Tarea Asignada', 'OT movida a "Mis Tareas de Prensa".');
                tr.remove();
            }
        });
    }
};