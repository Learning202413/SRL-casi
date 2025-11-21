/**
 * js/views/admin.ui.js
 * Lógica global de la interfaz de usuario (modales, sidebar toggle, etc.).
 */

const UI = (function() {
    
    // Función que establece el estado de la sidebar de forma determinística
    function setSidebarState(isVisible) {
        const sidebarEl = document.getElementById('sidebar-menu');
        const mainContentEl = document.getElementById('main-content');
        const toggleIconEl = document.querySelector('#sidebar-toggle i');
        if (!mainContentEl || !sidebarEl) return;

        // 1. Sidebar (Visibilidad y animación)
        if (isVisible) {
            sidebarEl.classList.remove('-translate-x-full'); // Mostrar
        } else {
            sidebarEl.classList.add('-translate-x-full'); // Ocultar
        }
        
        // 2. Contenido principal (Margen para hacer espacio)
        if (isVisible) {
            mainContentEl.classList.add('ml-64');
            mainContentEl.classList.remove('ml-0');
        } else {
            mainContentEl.classList.remove('ml-64');
            mainContentEl.classList.add('ml-0');
        }
        
        // 3. Icono del botón
        if (toggleIconEl) {
            toggleIconEl.setAttribute('data-lucide', isVisible ? 'menu' : 'chevrons-right'); 
            window.lucide.createIcons(); 
        }
    }

    // Función central para alternar la visibilidad
    function toggleSidebar() {
        const sidebarEl = document.getElementById('sidebar-menu');
        if (!sidebarEl) return;
        
        // Determinar si actualmente está visible (si NO contiene la clase de ocultar)
        const isCurrentlyVisible = !sidebarEl.classList.contains('-translate-x-full');
        const shouldBeVisible = !isCurrentlyVisible; 
        
        setSidebarState(shouldBeVisible);
    }

    // =========================================================================
    // LÓGICA DE MODALES (INYECCIÓN DE CONTENIDO)
    // =========================================================================

    // Muestra un modal e inyecta su contenido dinámico (si existe)
    function showModal(containerId, contentId = null) {
        const container = document.getElementById(containerId);
        
        if (contentId) {
            const contentSource = document.getElementById(contentId);
            if (contentSource && container) {
                // 1. Inyecta el contenido HTML del modal en el contenedor global
                container.innerHTML = contentSource.innerHTML;
            }
        }
        
        if (container) {
            // 2. Re-renderizar iconos de Lucide (DEBE ocurrir después de innerHTML)
            if (window.lucide) window.lucide.createIcons();
            
            // 3. Mostrar el modal
            container.classList.remove('hidden');
        }
    }

    // Oculta un modal
    function hideModal(modalId) {
        const container = document.getElementById(modalId);
        if (container) {
            container.classList.add('hidden');
        }
        
        // CRUCIAL: Limpiar el contenido del modal después de ocultarlo para evitar la
        // persistencia del estado del formulario (Crear/Editar) y la duplicación de contenido.
        if (container && (
            modalId === 'confirm-modal-container' || 
            modalId === 'user-modal-container' || 
            modalId === 'provider-modal-container' || 
            modalId === 'assign-modal-container'
        )) {
             // Limpiar el contenido completamente para la próxima inyección
             container.innerHTML = ''; 
        }
    }

    // Modal de confirmación reusable (Diseño mejorado y centrado)
    function showConfirmModal(title, message, confirmButtonText, callback) {
        const container = document.getElementById('confirm-modal-container');
        if (!container) return;

        // Limpiar contenido previo y mostrarlo
        container.innerHTML = '';
        container.classList.remove('hidden');

        // **************** INICIO DEL DISEÑO MEJORADO ****************
        const modalHtml = `
            <div class="p-8 border w-full max-w-sm rounded-xl bg-white shadow-2xl scale-100 animate-fade-in">
                <!-- Icono de Alerta -->
                <div class="flex justify-center mb-4">
                    <i data-lucide="shield-alert" class="w-10 h-10 text-red-500"></i>
                </div>

                <h3 class="text-xl font-extrabold text-center mb-2 text-gray-800">${title}</h3>
                <p class="text-gray-600 mb-8 text-center">${message}</p>
                
                <div class="flex justify-center space-x-4">
                    <button type="button" onclick="window.UI.hideModal('confirm-modal-container')" class="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition">Cancelar</button>
                    <button id="confirm-action-btn" class="px-6 py-2 color-primary-red text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition">${confirmButtonText}</button>
                </div>
            </div>
        `;
        // **************** FIN DEL DISEÑO MEJORADO ****************

        container.innerHTML = modalHtml;
        
        // Inicializar iconos de Lucide (necesario para el icono shield-alert)
        if (window.lucide) window.lucide.createIcons();

        // Adjuntar el listener de confirmación
        document.getElementById('confirm-action-btn').addEventListener('click', () => {
            callback();
            hideModal('confirm-modal-container');
        });
    }
    
    // =========================================================================
    // ESTADO DE SIDEBAR
    // =========================================================================

    function setSidebarVisible() {
        setSidebarState(true);
    }
    
    function setSidebarHidden() {
        setSidebarState(false);
    }

    // =========================================================================
    // EVENTOS GLOBALES
    // =========================================================================

    function initGlobalEvents() {
        // Inicializar iconos de Lucide
        if (window.lucide) {
             window.lucide.createIcons();
        }
       
        // Conexión del botón Toggle del Sidebar (se busca en la vista recién cargada)
        const toggleButton = document.getElementById('sidebar-toggle');
        
        // Limpiar el listener anterior antes de adjuntar uno nuevo (CRUCIAL)
        toggleButton?.removeEventListener('click', toggleSidebar); 

        // Adjuntar el listener
        if (toggleButton) {
            window.UI = UI; // Exponer UI para llamadas directas como onclick="window.UI.hideModal(...)"
            toggleButton.addEventListener('click', toggleSidebar);
        }
    }

    return {
        toggleSidebar,
        showModal,
        hideModal,
        showConfirmModal, 
        initGlobalEvents,
        setSidebarVisible,
        setSidebarHidden
    };
})();

export { UI };