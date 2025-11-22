/**
 * js/postprensa.main.js
 * Punto de entrada único para la aplicación Post-Prensa.
 */
import { UI } from './views/postprensa.ui.js';
import { Router } from './postprensa.router.js';
import { renderSidebar } from './views/postprensa.sidebar.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Post-Prensa Application initializing...");
    
    // 1. Inicializar la UI global (iconos, modals, etc.)
    UI.initGlobalEvents();

    // 2. Asegurar que la barra lateral esté visible al inicio
    UI.setSidebarVisible();

    // 3. Renderizar la barra lateral (usa 'cola' como vista por defecto)
    renderSidebar('cola', 'Op. Acabados'); // Nombre de rol de ejemplo

    // 4. Iniciar el Router
    Router.init();
});