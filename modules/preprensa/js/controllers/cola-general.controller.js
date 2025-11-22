import { ColaGeneralService } from '../services/cola.general.service.js';

export const ColaGeneralController = {
    init: async function() {
        console.log("ColaGeneralController: Buscando tareas desde CRM...");
        await this.loadTasks();
        this.setupEvents();
    },

    async loadTasks() {
        const tbody = document.getElementById('tasks-table-body');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Cargando tareas del CRM...</td></tr>';
        
        const tasks = await ColaGeneralService.getUnassignedTasks();
        this.renderTable(tasks);
    },

    renderTable(tasks) {
        const tbody = document.getElementById('tasks-table-body');
        tbody.innerHTML = '';

        if (tasks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">No hay OTs nuevas ("Orden creada") en el CRM.</td></tr>';
            return;
        }

        tasks.forEach(task => {
            const row = `
                <tr class="hover:bg-gray-50 transition border-b last:border-0" data-id="${task.id}">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${task.ot_id || 'PENDIENTE'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${task.cliente}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${task.producto}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${task.fecha_creacion}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Nueva (CRM)</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button class="btn-take-task flex items-center justify-center mx-auto px-3 py-1 text-sm bg-[#E31B23] text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 transition">
                            <i data-lucide="download" class="w-4 h-4 mr-1"></i> Tomar
                        </button>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        if (window.lucide) window.lucide.createIcons();
    },

    setupEvents() {
        const tbody = document.getElementById('tasks-table-body');
        tbody?.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-take-task');
            if (btn) {
                const tr = btn.closest('tr');
                const id = tr.dataset.id;
                
                btn.disabled = true;
                btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>';
                if(window.lucide) window.lucide.createIcons();

                const success = await ColaGeneralService.assignTaskToMe(id);
                
                if (success) {
                    window.UI.showNotification('Tarea Asignada', `OT asignada correctamente. Revisa "Mis Tareas".`);
                    tr.style.opacity = '0';
                    setTimeout(() => tr.remove(), 300);
                }
            }
        });
    }
};