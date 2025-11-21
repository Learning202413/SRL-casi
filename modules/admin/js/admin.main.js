/**
 * js/admin.main.js
 * Punto de entrada único para la aplicación Admin.
 * Inicializa la UI, el router y el estado inicial.
 */
// Rutas de importación corregidas
import { UI } from './views/admin.ui.js';
import { Router } from './admin.router.js';
import { renderSidebar } from './views/admin.sidebar.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin Application initializing...");
    
    // 1. Inicializar la UI global (icons, modals, etc.)
    UI.initGlobalEvents();

    // ** CRUCIAL: Asegurar que la barra lateral esté visible al inicio (estado por defecto) **
    UI.setSidebarVisible();

    // 2. Renderizar la barra lateral inicialmente (usa 'dashboard' como vista por defecto)
    renderSidebar('dashboard', 'Gerente General');

    // 3. Iniciar el Router
    Router.init();
});