/**
 * js/inventario.main.js
 * Punto de entrada único para la aplicación Inventario.
 */
import { UI } from './views/inventario.ui.js';
import { Router } from './inventario.router.js';
import { renderSidebar } from './views/inventario.sidebar.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Inventario Application initializing...");
    
    // 1. Inicializar la UI global (iconos, modals, etc.)
    UI.initGlobalEvents();

    // 2. Asegurar que la barra lateral esté visible al inicio
    UI.setSidebarVisible();

    // 3. Renderizar la barra lateral (usa 'dashboard' como vista por defecto)
    renderSidebar('dashboard', 'Gestor de Almacén'); // Nombre de rol de ejemplo

    // 4. Iniciar el Router
    Router.init();
});