// /produccion-interna/core/http/supabase.client.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
// Importamos las constantes desde el archivo de configuración
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/supabase.config.js';

/**
 * @fileoverview Cliente central de Supabase. 
 * Permite que cualquier módulo de la aplicación acceda a la base de datos 
 * y a la autenticación sin reconfigurar.
 */

// NOTA: 'SUPABASE_URL' y 'SUPABASE_ANON_KEY' deben estar definidos 
// en /produccion-interna/config/supabase.config.js
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("FATAL ERROR: Las credenciales de Supabase no están configuradas en supabase.config.js.");
}

/**
 * El cliente de Supabase inicializado.
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportamos el cliente como default para que auth.service.js lo pueda usar
export default supabase;

console.log("[CORE:HTTP] Cliente Supabase inicializado y disponible.");
// Aquí podríamos añadir lógica inicial de autenticación, como verificar sesión.
// Por ejemplo, podríamos añadir un listener para onAuthStateChange si fuera necesario aquí.