/**
 * js/controllers/historial.orden.controller.js
 * Controlador de UI para Trazabilidad.
 */
import { HistorialOrdenService } from '../services/historial.orden.service.js';

export const HistorialOrdenController = {
    init: function() {
        console.log("HistorialOrdenController inicializado.");
        
        const searchButton = document.getElementById('btn-search-ot');
        const searchInput = document.getElementById('search-ot-input');

        if(searchButton && searchInput) {
            const performSearch = () => this.handleSearch(searchInput.value.trim());
            
            searchButton.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') performSearch();
            });
            
            // Auto-focus al iniciar
            searchInput.focus();
        }
    },

    async handleSearch(query) {
        const timelineContainer = document.getElementById('trace-timeline');
        const panel = document.getElementById('trace-panel');
        const titleSpan = document.getElementById('trace-title');

        if (!query) {
            // Pequeña animación de error visual si está vacío
            const input = document.getElementById('search-ot-input');
            input.classList.add('ring-2', 'ring-red-500', 'bg-red-50');
            setTimeout(() => input.classList.remove('ring-2', 'ring-red-500', 'bg-red-50'), 500);
            return;
        }

        // 1. MOSTRAR EL PANEL (Quitamos la clase hidden)
        if(panel) panel.classList.remove('hidden');

        // Feedback de carga
        timelineContainer.innerHTML = `
            <li class="ml-6 flex items-center text-gray-500">
                <div class="absolute flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full -left-4 ring-8 ring-white">
                    <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
                </div>
                <span class="ml-4">Buscando trazabilidad...</span>
            </li>`;
        if(window.lucide) window.lucide.createIcons();

        // 2. LLAMADA AL SERVICIO
        const result = await HistorialOrdenService.getTraceabilityData(query);

        // 3. MANEJO DE UI (No encontrado)
        if (!result) {
            if(titleSpan) titleSpan.textContent = "Orden No Encontrada";
            timelineContainer.innerHTML = `
                <li class="ml-6">
                    <div class="absolute flex items-center justify-center w-8 h-8 bg-red-200 rounded-full -left-4 ring-8 ring-white">
                        <i data-lucide="x" class="w-5 h-5 text-red-700"></i>
                    </div>
                    <div class="bg-red-50 p-4 rounded-lg border border-red-100">
                        <h3 class="font-semibold text-lg text-red-800">Sin resultados</h3>
                        <p class="text-sm text-red-600">No existe registro con el ID: <strong>${query}</strong></p>
                    </div>
                </li>
            `;
            if(window.lucide) window.lucide.createIcons();
            return;
        }

        // 4. MANEJO DE UI (Éxito)
        const { ot, events } = result;
        if(titleSpan) titleSpan.innerHTML = `Ciclo de Vida: <span class="text-red-600">${ot.ot_id || ot.id}</span> <span class="text-sm text-gray-500 font-normal ml-2">(${ot.cliente_nombre})</span>`;

        this.renderTimeline(events, timelineContainer);
    },

    renderTimeline(events, container) {
        container.innerHTML = '';

        if (events.length === 0) {
            container.innerHTML = `<li class="ml-6 text-gray-500 italic">Orden registrada, pero sin eventos cronológicos detectados.</li>`;
            return;
        }

        const colorMap = {
            blue:   { bg: 'bg-blue-200', text: 'text-blue-700' },
            green:  { bg: 'bg-green-200', text: 'text-green-700' },
            yellow: { bg: 'bg-yellow-200', text: 'text-yellow-700' },
            red:    { bg: 'bg-red-200', text: 'text-red-700' },
            indigo: { bg: 'bg-indigo-200', text: 'text-indigo-700' },
            purple: { bg: 'bg-purple-200', text: 'text-purple-700' },
            orange: { bg: 'bg-orange-200', text: 'text-orange-700' },
            gray:   { bg: 'bg-gray-200', text: 'text-gray-600' },
        };

        events.forEach(evt => {
            const style = colorMap[evt.color] || colorMap['gray'];
            const detailHtml = evt.details ? `<p class="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded border border-gray-100 inline-block"><i data-lucide="info" class="w-3 h-3 inline mr-1"></i>${evt.details}</p>` : '';
            const isLogBadge = evt.isLog ? '<span class="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200">LOG</span>' : '';

            const html = `
                <li class="ml-6 relative pb-8 last:pb-0 group">
                    <div class="absolute top-4 -left-4 -ml-px h-full w-0.5 bg-gray-200 group-last:hidden" aria-hidden="true"></div>
                    
                    <span class="absolute flex items-center justify-center w-8 h-8 ${style.bg} rounded-full -left-4 ring-4 ring-white z-10 shadow-sm">
                        <i data-lucide="${evt.icon}" class="w-4 h-4 ${style.text}"></i>
                    </span>
                    
                    <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                        <div class="flex justify-between items-start mb-1">
                            <h3 class="font-bold text-gray-800 text-base flex items-center">
                                ${evt.title} ${isLogBadge}
                            </h3>
                            <span class="text-xs font-medium text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">${evt.time}</span>
                        </div>
                        
                        <p class="text-sm text-gray-500 flex items-center">
                            <i data-lucide="user" class="w-3 h-3 mr-1.5 text-gray-400"></i> ${evt.user}
                        </p>
                        ${detailHtml}
                    </div>
                </li>
            `;
            container.insertAdjacentHTML('beforeend', html);
        });

        if(window.lucide) window.lucide.createIcons();
    }
};