import { supabase } from '../http/supabase.client.js';

/**
 * Servicio de autenticación para interactuar con Supabase Auth.
 * Proporciona métodos para iniciar sesión, cerrar sesión y obtener el usuario actual.
 * ESTE ARCHIVO SOLO HABLA CON EL SERVICIO DE AUTH DE SUPABASE.
 */
class AuthService {
    /**
     * Intenta iniciar sesión con email y contraseña utilizando Supabase.
     * @param {string} email - El correo electrónico del usuario.
     *@param {string} password - La contraseña del usuario.
     * @returns {Promise<{user: object | null, error: object | null}>} Un objeto con el usuario si es exitoso o un error.
     */
    async login(email, password) {
        try {
            // Usamos signInWithPassword para la autenticación por correo/contraseña
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                console.error("Error de login de Supabase:", error.message);
                return { user: null, error: error };
            }

            // data.user contiene la información del usuario autenticado
            return { user: data.user, error: null };
        } catch (e) {
            console.error("Excepción en el servicio de login:", e.message);
            return { user: null, error: { message: "Error inesperado durante el login." } };
        }
    }

    /**
     * Cierra la sesión del usuario.
     * @returns {Promise<{error: object | null}>}
     */
    async logout() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error al cerrar sesión de Supabase:", error.message);
            return { error: error };
        }
        return { error: null };
    }

    /**
     * Obtiene la sesión de usuario actual.
     * @returns {Promise<object | null>} El objeto usuario o null si no hay sesión.
     */
    async getCurrentUser() {
        // Usamos getUser para obtener la información de la sesión actual
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }
}

export const authService = new AuthService();