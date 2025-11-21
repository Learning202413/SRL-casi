/**
 * js/controllers/cliente.detalle.controller.js
 * Controlador para Crear/Editar clientes.
 * Lógica actualizada: Flujo inteligente de "Guardar y Cotizar".
 */
import { ClienteDetalleService } from '../services/cliente.detalle.service.js';

export const ClienteDetalleController = {
    init: async function(params) {
        const clientId = params[0];
        const isEditMode = !!clientId;
        
        console.log(`ClienteDetalleController inicializado. Modo: ${isEditMode ? 'Edición' : 'Creación'}`);

        this.setupTabs();
        const headerEl = document.getElementById('client-header');
        
        // 1. PRIMERO: Configuramos el FORMULARIO (El contenedor padre)
        // Esto limpia cualquier listener anterior y nos da un formulario "fresco"
        const form = document.getElementById('client-form');
        let currentForm = form; // Referencia al formulario activo

        if (form) {
            const newForm = form.cloneNode(true); 
            form.parentNode.replaceChild(newForm, form);
            currentForm = newForm; // Actualizamos la referencia

            // Listener para el guardado normal (Botón "Guardar Cliente")
            currentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                // false = guarda y regresa a la lista
                await this.saveAndRedirect(currentForm, clientId, false);
            });
        }

        // 2. SEGUNDO: Configuramos el BOTÓN (El hijo)
        // Ahora buscamos el botón DENTRO del formulario ya renovado
        const linkBtn = document.getElementById('btn-create-quote');

        if (linkBtn) {
            if (isEditMode) {
                // --- MODO EDICIÓN ---
                // El cliente ya existe, redirigimos directamente
                linkBtn.href = `#/orden-detalle/new/${clientId}`;
            } else {
                // --- MODO CREACIÓN ---
                // El cliente NO existe. Interceptamos el click.
                linkBtn.removeAttribute('href'); 
                linkBtn.style.cursor = 'pointer'; 
                
                // Como el formulario es nuevo, podemos agregar el listener directamente
                linkBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation(); 
                    
                    // Validamos y guardamos pasando 'true' para redirigir a cotización
                    // Usamos 'currentForm' para asegurar que leemos los datos correctos
                    await this.saveAndRedirect(currentForm, null, true);
                });
            }
        } else {
            console.error("Error: No se encontró el botón 'btn-create-quote' en el DOM.");
        }

        // 3. TERCERO: Carga de Datos (Si es edición)
        if (isEditMode) {
            headerEl.textContent = 'Cargando datos...';
            const client = await ClienteDetalleService.getClientById(clientId);
            
            if (client) {
                headerEl.textContent = `Editando: ${client.razon_social}`;
                this.populateForm(client);
            } else {
                window.UI.showNotification('Error', 'Cliente no encontrado.');
                setTimeout(() => window.location.hash = '#/clientes', 1500);
                return;
            }
        } else {
            headerEl.textContent = 'Crear Nuevo Cliente';
            // El reset ya ocurrió implícitamente al clonar el form, pero aseguramos
            currentForm?.reset();
        }
        
        if (window.lucide) window.lucide.createIcons();
    },

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // 1. RESETEAR TODOS: Les quitamos el rojo y les devolvemos el color gris/transparente
                tabButtons.forEach(btn => {
                    btn.classList.remove('tab-active', 'border-red-500', 'text-red-500');
                    btn.classList.add('border-transparent', 'text-gray-500');
                });
                
                // Ocultar todos los contenidos
                tabContents.forEach(content => content.classList.add('hidden'));

                // 2. ACTIVAR EL SELECCIONADO: Quitamos lo gris y ponemos lo ROJO
                const tabId = e.currentTarget.dataset.tab;
                const currentBtn = e.currentTarget;
                
                // IMPORTANTE: Aquí quitamos 'border-transparent' para que la línea roja se vea nítida
                currentBtn.classList.remove('border-transparent', 'text-gray-500'); 
                currentBtn.classList.add('tab-active', 'border-red-500', 'text-red-500'); 
                
                document.getElementById(`tab-${tabId}`)?.classList.remove('hidden');
            });
        });

        // 3. ACTIVACIÓN AUTOMÁTICA:
        // Al simular el click, se ejecuta la lógica de arriba y la línea roja aparece al instante.
        const defaultTab = document.querySelector('[data-tab="details"]');
        if (defaultTab) {
            defaultTab.click();
        }
    },
    

    populateForm(client) {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        };
        setVal('ruc', client.ruc);
        setVal('razon_social', client.razon_social);
        setVal('nombre_contacto', client.nombre_contacto);
        setVal('email', client.email);
        setVal('telefono', client.telefono);
    },

    async saveAndRedirect(form, id, goToQuote) {
        const formData = {
            ruc: form.querySelector('#ruc').value,
            razon_social: form.querySelector('#razon_social').value,
            nombre_contacto: form.querySelector('#nombre_contacto').value,
            email: form.querySelector('#email').value,
            telefono: form.querySelector('#telefono').value,
        };

        if (!formData.ruc || !formData.razon_social || !formData.email) {
            window.UI.showNotification('Error', 'Por favor complete los campos obligatorios (*).');
            return;
        }

        try {
            let finalId = id;

            if (id) {
                // Update
                await ClienteDetalleService.updateClient(id, formData);
                window.UI.showNotification('Éxito', 'Cliente actualizado.');
            } else {
                // Create
                const res = await ClienteDetalleService.createClient(formData);
                finalId = res.id; // ID generado
                window.UI.showNotification('Éxito', 'Cliente registrado correctamente.');
            }
            
            if (goToQuote && finalId) {
                // Esperamos un momento para que la notificación se vea y luego redirigimos
                setTimeout(() => {
                    window.location.hash = `#/orden-detalle/new/${finalId}`;
                }, 500);
            } else {
                setTimeout(() => {
                    window.location.hash = '#/clientes';
                }, 1000);
            }

        } catch (error) {
            console.error(error);
            window.UI.showNotification('Error', 'Ocurrió un error al guardar.');
        }
    }
};