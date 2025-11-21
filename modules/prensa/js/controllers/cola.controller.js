import { ColaService } from '../services/cola.service.js';

export const ColaController = {
    init: async function() {
        console.log("ColaController (Prensa): Cargando mis tareas...");
        await this.loadTasks();
        // Exponer función globalmente para el onclick del HTML generado dinámicamente
        window.startPrensaTask = this.startTask.bind(this);
    },

    async loadTasks() {
        const tasks = await ColaService.getMyTasks();
        this.renderTable(tasks);
    },

    // LOGICA DEL BOTÓN "INICIAR"
    async startTask(id) {
        const btn = document.getElementById(`btn-action-${id}`);
        if(btn) {
            // Feedback visual de carga
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-1"></i> ...';
            if(window.lucide) window.lucide.createIcons();
        }

        // 1. Cambiar estado a 'En proceso' en la BD
        await ColaService.updateStatus(id, 'En proceso');
        
        // 2. Redirigir a la terminal del operador
        window.location.hash = `#/operador/${id}`;
    },

    renderTable(tasks) {
        const tbody = document.getElementById('tasks-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (tasks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">No tienes tareas activas.</td></tr>';
            return;
        }

        tasks.forEach(task => {
            let actionHtml = '';

            // LÓGICA DE ESTADOS PARA EL BOTÓN DE ACCIÓN
            if (task.estado === 'Asignada a Prensa') {
                // Caso 1: Tarea nueva -> Botón "Iniciar" que ejecuta la lógica JS
                actionHtml = `
                    <button id="btn-action-${task.id}" onclick="window.startPrensaTask('${task.id}')" class="flex items-center justify-center mx-auto px-3 py-1 text-sm bg-[#E31B23] text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 transition">
                        <i data-lucide="play" class="w-4 h-4 mr-1"></i> Iniciar
                    </button>
                `;
            } else {
                // Caso 2: Tarea ya iniciada -> Botón "Continuar" que lleva directo a la terminal
                actionHtml = `
                    <a href="#/operador/${task.id}" class="flex items-center justify-center mx-auto px-3 py-1 text-sm bg-[#E31B23] text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 transition">
                        <i data-lucide="arrow-right-circle" class="w-4 h-4 mr-1"></i> Continuar
                    </a>
                `;
            }

            const row = `
                <tr class="hover:bg-gray-50 transition border-b last:border-0">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${task.ot_id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${task.cliente}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">${task.maquina}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${task.producto}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${task.fecha}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.badgeColor}">${task.estado}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        ${actionHtml}
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        
        // Refrescar iconos Lucide
        if (window.lucide) window.lucide.createIcons();
    }
};