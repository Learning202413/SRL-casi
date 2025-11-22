/**
 * js/crm.main.js
 * Punto de entrada único para la aplicación CRM.
 * Inicializa la UI, el router y el estado inicial.
 */
import { UI } from './views/crm.ui.js';
import { Router } from './crm.router.js';
import { renderSidebar } from './views/crm.sidebar.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("CRM Application initializing...");
    
    // 1. Inicializar la UI global (iconos, modals, etc.)
    UI.initGlobalEvents();

    // 2. Asegurar que la barra lateral esté visible al inicio
    UI.setSidebarVisible();

    // 3. Renderizar la barra lateral (usa 'dashboard' como vista por defecto)
    renderSidebar('dashboard', 'Vendedor'); // Nombre de rol de ejemplo

    // 4. Iniciar el Router
    Router.init();
});