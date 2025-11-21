// /produccion-interna/modules/auth/js/login.controller.js

import { usersDB } from './modules/admin/js/services/users.db.js';

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const messageBox = document.getElementById('messageBox');
// URL base de los módulos
const MODULES_PATH = './modules';
const SESSION_KEY = 'erp_session'; // Clave para localStorage

/**
 * Muestra un mensaje en la caja de mensajes.
 */
function showMessage(message, type) {
    if (!messageBox) return; 

    messageBox.textContent = message;
    messageBox.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700', 'bg-yellow-100', 'text-yellow-700');
    
    if (type === 'error') {
        messageBox.classList.add('bg-red-100', 'text-red-700');
    } else if (type === 'success') {
        messageBox.classList.add('bg-green-100', 'text-green-700');
    } else if (type === 'warning') {
        messageBox.classList.add('bg-yellow-100', 'text-yellow-700');
    }
    messageBox.classList.remove('hidden');
}

/**
 * Habilita o deshabilita la interfaz durante la carga.
 */
function toggleLoading(isLoading) {
    if (!loginButton || !emailInput || !passwordInput) return;
    
    loginButton.disabled = isLoading;
    loginButton.textContent = isLoading ? 'Cargando...' : 'Iniciar Sesión';
    emailInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
    
    if (isLoading && messageBox) {
        messageBox.classList.add('hidden');
    }
}

/**
 * Inicializa el toggle de contraseña.
 */
function initializePasswordToggle() {
    const togglePassword = document.getElementById('togglePassword');
    const eyeOpen = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');
    
    if (togglePassword && passwordInput && eyeOpen && eyeClosed) {
        togglePassword.addEventListener('click', function (e) {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            eyeOpen.classList.toggle('hidden');
            eyeClosed.classList.toggle('hidden');
        });
    }
}

/**
 * Redirige al usuario según su rol.
 */
function redirectUserByRole(rol) {
    let redirectUrl = '';

    switch (rol) {
        case 'Admin (Gerente)':
            redirectUrl = `${MODULES_PATH}/admin/index.html`;
            break;
        case 'Vendedor (CRM)':
            redirectUrl = `${MODULES_PATH}/crm/index.html`;
            break;
        case 'Diseñador (Pre-Prensa)':
            redirectUrl = `${MODULES_PATH}/preprensa/index.html`;
            break;
        case 'Operador (Prensa)':
            redirectUrl = `${MODULES_PATH}/prensa/index.html`;
            break;
        case 'Operador (Post-Prensa)':
            redirectUrl = `${MODULES_PATH}/postprensa/index.html`;
            break;
        case 'Almacén (Inventario)':
            redirectUrl = `${MODULES_PATH}/inventario/index.html`;
            break;
        default:
            console.warn(`Rol desconocido: ${rol}.`);
            showMessage('Tu usuario tiene un rol no configurado.', 'error');
            toggleLoading(false);
            return;
    }

    if (redirectUrl) {
        window.location.href = redirectUrl;
    }
}

// 1. Verificar sesión al cargar (Local)
async function checkSession() {
    try {
        const sessionStr = localStorage.getItem(SESSION_KEY);
        if (sessionStr) {
            const user = JSON.parse(sessionStr);
            if (user && user.role) {
                console.log("Sesión activa encontrada para:", user.name);
                // Opcional: redirigir automáticamente si ya hay sesión
                // redirectUserByRole(user.role); 
            }
        }
    } catch (e) {
        console.error("Error al verificar sesión:", e);
    }
}

// 2. Manejar el login
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    toggleLoading(true);

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showMessage('Por favor, ingresa tu correo y contraseña.', 'error');
        toggleLoading(false);
        return;
    }

    try {
        // A. Obtener usuarios de la BD simulada
        const users = await usersDB.getUsers();
        
        // B. Buscar coincidencia de email (Login Simulado)
        // Nota: Aceptamos cualquier contraseña no vacía para la demo
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (user) {
            // C. Login Exitoso -> Guardar en LocalStorage
            localStorage.setItem(SESSION_KEY, JSON.stringify(user));

            showMessage(`¡Bienvenido, ${user.name}!`, 'success');
            
            setTimeout(() => {
                redirectUserByRole(user.role);
            }, 800);

        } else {
            // D. Error
            showMessage('Usuario no encontrado o credenciales incorrectas.', 'error');
            toggleLoading(false);
        }
    } catch (exception) {
        console.error("Excepción al intentar login:", exception);
        showMessage('Error del sistema. Por favor, inténtalo más tarde.', 'error');
        toggleLoading(false);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initializePasswordToggle();
    checkSession();
});