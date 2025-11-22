/**
 * js/prensa.main.js
 * Punto de entrada único para la aplicación Prensa.
 */
import { UI } from './views/prensa.ui.js';
import { Router } from './prensa.router.js';
import { renderSidebar } from './views/prensa.sidebar.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Prensa Application initializing...");
    
    // 1. Inicializar la UI global (iconos, modals, etc.)
    UI.initGlobalEvents();

    // 2. Asegurar que la barra lateral esté visible al inicio
    UI.setSidebarVisible();

    // 3. Renderizar la barra lateral (usa 'cola' como vista por defecto)
    renderSidebar('cola', 'Operador de Prensa'); // Nombre de rol de ejemplo

    // 4. Iniciar el Router
    Router.init();
});