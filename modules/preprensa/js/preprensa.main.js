/**
 * js/preprensa.main.js
 * Punto de entrada único para la aplicación Pre-Prensa.
 */
import { UI } from './views/preprensa.ui.js';
import { Router } from './preprensa.router.js';
import { renderSidebar } from './views/preprensa.sidebar.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Pre-Prensa Application initializing...");
    
    // 1. Inicializar la UI global (iconos, modals, etc.)
    UI.initGlobalEvents();

    // 2. Asegurar que la barra lateral esté visible al inicio
    UI.setSidebarVisible();

    // 3. Renderizar la barra lateral (usa 'cola' como vista por defecto)
    renderSidebar('cola', 'Diseñador 1'); // Nombre de rol de ejemplo

    // 4. Iniciar el Router
    Router.init();
});