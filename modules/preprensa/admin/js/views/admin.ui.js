/**
 * js/views/admin.ui.js
 * Lógica global de la interfaz de usuario (modales, sidebar toggle, notificaciones).
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

    // Modal de confirmación reusable
    function showConfirmModal(title, message, confirmButtonText, callback) {
        const container = document.getElementById('confirm-modal-container');
        if (!container) return;

        container.innerHTML = '';
        container.classList.remove('hidden');

        const modalHtml = `
            <div class="p-8 border w-full max-w-sm rounded-xl bg-white shadow-2xl scale-100 animate-fade-in">
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

        container.innerHTML = modalHtml;
        
        if (window.lucide) window.lucide.createIcons();

        document.getElementById('confirm-action-btn').addEventListener('click', () => {
            callback();
            hideModal('confirm-modal-container');
        });
    }

    // =========================================================================
    // SISTEMA DE NOTIFICACIONES (TOASTS) - NUEVO
    // =========================================================================

    function showNotification(title, message) {
        // 1. Crear contenedor de notificaciones si no existe
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'fixed bottom-4 right-4 z-[60] flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(container);
        }

        // 2. Determinar estilos según el título (Error vs Éxito)
        const isError = title.toLowerCase().includes('error') || title.toLowerCase().includes('atención');
        const borderColor = isError ? 'border-red-500' : 'border-green-500';
        const iconName = isError ? 'alert-circle' : 'check-circle';
        const iconColor = isError ? 'text-red-500' : 'text-green-500';

        // 3. Crear el elemento Toast
        const toast = document.createElement('div');
        toast.className = `pointer-events-auto bg-white border-l-4 ${borderColor} shadow-2xl rounded-lg p-4 w-80 flex items-start transform transition-all duration-500 translate-y-10 opacity-0`;
        
        toast.innerHTML = `
            <div class="flex-shrink-0">
                <i data-lucide="${iconName}" class="w-6 h-6 ${iconColor}"></i>
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
                <p class="text-sm font-bold text-gray-900">${title}</p>
                <p class="mt-1 text-sm text-gray-500">${message}</p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
                <button class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none btn-close-toast">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `;

        container.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        // 4. Animar entrada (pequeño delay para permitir renderizado)
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-10', 'opacity-0');
        });

        // 5. Función de cierre
        const closeToast = () => {
            toast.classList.add('opacity-0', 'translate-x-full'); // Animar salida
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 500);
        };

        // Listener botón cerrar
        toast.querySelector('.btn-close-toast').addEventListener('click', closeToast);

        // Auto-cierre a los 4 segundos
        setTimeout(closeToast, 4000);
    }
    
    // =========================================================================
    // ESTADO DE SIDEBAR Y GLOBALES
    // =========================================================================

    function setSidebarVisible() { setSidebarState(true); }
    function setSidebarHidden() { setSidebarState(false); }

    function initGlobalEvents() {
        if (window.lucide) window.lucide.createIcons();
       
        const toggleButton = document.getElementById('sidebar-toggle');
        toggleButton?.removeEventListener('click', toggleSidebar); 

        if (toggleButton) {
            window.UI = UI; 
            toggleButton.addEventListener('click', toggleSidebar);
        }
    }

    // Exponer funciones públicas
    return {
        toggleSidebar,
        showModal,
        hideModal,
        showConfirmModal,
        showNotification, // <--- ¡AGREGADA AQUÍ!
        initGlobalEvents,
        setSidebarVisible,
        setSidebarHidden
    };
})();

export { UI };