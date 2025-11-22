import { ColaService } from '../services/cola.service.js';

export const ColaController = {
    init: async function() {
        console.log("ColaController: Cargando mis tareas...");
        await this.loadTasks();
        // Exponemos la función al scope global para que el onclick funcione
        window.startTask = this.startTask.bind(this);
    },

    async loadTasks() {
        let tasks = await ColaService.getMyTasks();

        // Mock de respaldo si está vacío
        if (!tasks || tasks.length === 0) {
            tasks = [
                { id: '1', ot_id: 'OT-1234', cliente: 'Industrias Gráficas S.A.', producto: '1000 Revistas A4', fecha_creacion: '16 nov 2025, 17:01', estado: 'Diseño Pendiente', badgeColor: 'bg-blue-100 text-blue-800' },
                { id: '2', ot_id: 'OT-1235', cliente: 'Editorial Futuro EIRL', producto: '500 Libros Tapa Dura', fecha_creacion: '15 nov 2025, 11:00', estado: 'En diseño', badgeColor: 'bg-indigo-100 text-indigo-800' },
                { id: '3', ot_id: 'OT-1230', cliente: 'Cliente Particular', producto: '250 Tarjetas Personales', fecha_creacion: '14 nov 2025, 09:30', estado: 'Cambios Solicitados', badgeColor: 'bg-red-100 text-red-800' }
            ];
        }
        this.renderTable(tasks);
    },

    // Nueva función que maneja el clic en "Comenzar"
    async startTask(id) {
        const btn = document.getElementById(`btn-action-${id}`);
        if(btn) {
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-1"></i> Iniciando...';
            if(window.lucide) window.lucide.createIcons();
        }

        // 1. Cambiar estado en DB
        await ColaService.updateStatus(id, 'En diseño');
        
        // 2. Redirigir al detalle
        window.location.hash = `#/detalle/${id}`;
    },

    renderTable(tasks) {
        const tbody = document.getElementById('tasks-table-body'); 
        if(!tbody) return;
        tbody.innerHTML = '';

        tasks.forEach(task => {
            let actionHtml = '';
            
            // LÓGICA DEL BOTÓN:
            // Si está Pendiente -> Botón que ejecuta startTask()
            // Si ya está En diseño/Aprobación -> Enlace normal href="..."
            
            if (task.estado === 'Diseño Pendiente') {
                actionHtml = `
                    <button id="btn-action-${task.id}" onclick="window.startTask('${task.id}')" class="flex items-center justify-center mx-auto px-3 py-1 text-sm bg-[#E31B23] text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 transition">
                        <i data-lucide="play" class="w-4 h-4 mr-1"></i> Comenzar
                    </button>
                `;
            } else {
                let btnText = 'Continuar';
                let icon = 'edit';
                if (task.estado === 'Cambios Solicitados') btnText = 'Corregir';
                
                actionHtml = `
                    <a href="#/detalle/${task.id}" class="flex items-center justify-center mx-auto px-3 py-1 text-sm bg-[#E31B23] text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 transition">
                        <i data-lucide="${icon}" class="w-4 h-4 mr-1"></i> ${btnText}
                    </a>
                `;
            }

            const badgeClass = task.badgeColor || 'bg-blue-100 text-blue-800';

            const row = `
                <tr class="hover:bg-gray-50 transition border-b last:border-0">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${task.ot_id || task.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${task.cliente}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${task.producto}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${task.fecha_creacion}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${badgeClass}">${task.estado}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        ${actionHtml}
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        if (window.lucide) window.lucide.createIcons();
    }
};