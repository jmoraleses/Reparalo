
import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/integrations/supabase/types';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.error('.env file not found!');
    process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin client for wiping data (bypasses RLS)
const adminClient = serviceRoleKey ? createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
}) : null;

const USERS = {
    client: {
        email: 'cliente_v4@demo.com',
        password: 'demo12134',
        name: 'Cliente V4',
        is_workshop: false
    },
    workshop: {
        email: 'taller_v4@demo.com',
        password: 'demo1234',
        name: 'Taller V4',
        is_workshop: true,
        workshop_name: 'ElectroFix Taller 3',
        workshop_city: 'Madrid'
    }
};

const IMPROVED_PRODUCTS = [
    { brand: 'Apple', model: 'iPhone 13 Pro', type: 'smartphone', problem: 'Pantalla Rota - Caída en asfalto', image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800&q=80' },
    { brand: 'Samsung', model: 'Galaxy S21 Ultra', type: 'smartphone', problem: 'No enciende tras mojarse', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80' },
    { brand: 'MacBook', model: 'Pro M1 14"', type: 'laptop', problem: 'Teclado mariposa atascado', image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80' },
    { brand: 'Sony', model: 'PlayStation 5', type: 'console', problem: 'HDMI dañado', image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80' },
    { brand: 'Apple', model: 'iPad Air 4', type: 'tablet', problem: 'Cristal estallado', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80' },
    { brand: 'Xiaomi', model: 'Mi Electric Scooter 3', type: 'other', problem: 'Error 14 (Acelerador)', image: 'https://placehold.co/800x600?text=Xiaomi+Scooter' },
    { brand: 'Dell', model: 'XPS 15 9500', type: 'laptop', problem: 'Pantalla azul constante', image: 'https://placehold.co/800x600?text=Dell+XPS' },
    { brand: 'Nintendo', model: 'Switch OLED', type: 'console', problem: 'Joycon drift izquierdo', image: 'https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?w=800&q=80' }
];

async function getAuthenticatedClient(userData: typeof USERS.client) {
    const client = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
    });
    const { data: { session }, error } = await client.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
    });

    if (error) {
        console.log(`SignIn failed for ${userData.email}: ${error.message}`);
        // Create if not exists
        const { data: authData, error: signUpError } = await client.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: { data: { full_name: userData.name } }
        });
        if (signUpError) {
            console.log(`SignUp also failed for ${userData.email}: ${signUpError.message}`);
            return null;
        }

        if (!authData.session) {
            console.log(`SignUp successful but NO SESSION for ${userData.email}. Email confirmation likely enabled.`);
            if (authData.user) console.log(`User ID created: ${authData.user.id}`);
            return null;
        }

        const userId = authData.session.user.id;

        // Upsert profile
        await client.from('profiles').upsert({
            id: userId,
            user_id: userId,
            full_name: userData.name,
            is_workshop: userData.is_workshop || false,
            workshop_name: (userData as any).workshop_name || null,
            workshop_city: (userData as any).workshop_city || null
        });

        return { client, userId };
    }

    // Also upsert for existing users (SignIn success path)
    const userId = session?.user?.id;
    if (userId) {
        await client.from('profiles').upsert({
            id: userId,
            user_id: userId,
            full_name: userData.name,
            is_workshop: userData.is_workshop || false,
            workshop_name: (userData as any).workshop_name || null,
            workshop_city: (userData as any).workshop_city || null
        });
    }

    return { client, userId };
}

async function main() {
    console.log("=== RESETTING AND SEEDING DB (CORRECTED) ===");

    // 1. Authenticate users
    const clientAuth = await getAuthenticatedClient(USERS.client);
    const workshopAuth = await getAuthenticatedClient(USERS.workshop);

    if (!clientAuth?.userId || !workshopAuth?.userId) {
        console.error("Failed to auth users");
        return;
    }

    const customerClient = clientAuth.client;
    const workshopClient = workshopAuth.client;

    console.log("Authenticated.");

    // Helper to delete all visible rows (relying on RLS or filters)
    const deleteAll = async (client: any, table: string) => {
        console.log(`Starting deletion for ${table}...`);

        // Supabase requires a WHERE clause for delete. 
        // We use neq '0000...' to match all UUIDs.
        // RLS will ensure we only delete what we are allowed to.
        const { error, count } = await client
            .from(table)
            .delete({ count: 'exact' })
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
            console.error(`  Delete failed for ${table}:`, error.message);
        } else {
            console.log(`  Deleted ${count ?? '?'} rows from ${table}`);
        }
    };

    // 2. Clear existing data in correct order
    console.log("--- CLEANUP PHASE ---");

    // Deleting history first (child of shipment)
    // Note: We use correct table name 'shipment_status_history'
    // This table might not be directly owned by user_id column, so we might need to rely on RLS or cascade.
    // However, if we delete shipments, history should cascade delete if FK is set to CASCADE.
    // Let's try deleting shipments directly first.

    console.log("Cleaning workshop data...");

    // Dependencies first
    await deleteAll(workshopClient, 'shipment_status_history');
    await deleteAll(workshopClient, 'shipments');
    await deleteAll(workshopClient, 'counter_offers');
    await deleteAll(workshopClient, 'ofertas');

    console.log("Cleaning customer data...");

    // Dependencies first
    await deleteAll(customerClient, 'messages');
    await deleteAll(customerClient, 'conversations');
    await deleteAll(customerClient, 'reviews');

    await deleteAll(customerClient, 'solicitudes');

    // 3. Create lots of new, high-quality requests
    console.log("--- SEED PHASE ---");
    // Helper to upload image
    const downloadAndUpload = async (url: string, userId: string, client: any) => {
        try {
            console.log(`  Downloading image: ${url.substring(0, 30)}...`);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
            const blob = await response.blob();

            const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            const { error: uploadError } = await client.storage
                .from('images')
                .upload(fileName, blob, {
                    contentType: 'image/jpeg'
                });

            if (uploadError) {
                console.error('  Upload failed:', uploadError);
                return url; // Fallback to original URL
            }

            const { data: { publicUrl } } = client.storage.from('images').getPublicUrl(fileName);
            console.log(`  > Uploaded to: ${publicUrl}`);
            return publicUrl;
        } catch (err) {
            console.error('  Image process failed:', err);
            return url; // Fallback
        }
    };

    console.log("Creating new improved requests...");

    for (let i = 0; i < 100; i++) {
        const prod = IMPROVED_PRODUCTS[Math.floor(Math.random() * IMPROVED_PRODUCTS.length)];

        // Upload image first
        const storedImageUrl = await downloadAndUpload(prod.image, clientAuth.userId, customerClient);

        const { data: request, error } = await customerClient
            .from('solicitudes')
            .insert({
                user_id: clientAuth.userId,
                device_brand: prod.brand,
                device_model: prod.model,
                device_type: prod.type,
                problem_description: prod.problem,
                city: 'Madrid',
                images: [storedImageUrl], // Use our new storage URL
                status: 'esperando_ofertas'
            })
            .select()
            .single();

        if (error || !request) {
            console.error(`Failed to create request for ${prod.model}:`, error);
            continue;
        }
        console.log(`Created request: ${prod.brand} ${prod.model}`);

        // 4. Create offers for some
        if (Math.random() > 0.3) {
            const { data: offer } = await workshopClient
                .from('ofertas')
                .insert({
                    solicitud_id: request.id,
                    workshop_id: workshopAuth.userId,
                    estimated_cost_min: Math.floor(Math.random() * 50) + 30,
                    estimated_cost_max: Math.floor(Math.random() * 50) + 100,
                    diagnosis_cost: 15,
                    transport_cost: 10,
                    estimated_days: Math.floor(Math.random() * 5) + 1,
                    status: 'pendiente'
                })
                .select()
                .single();

            if (offer) {
                console.log(`  > Offer created`);

                // 5. Advance status for some
                const rand = Math.random();
                if (rand > 0.7) {
                    // Accept offer
                    await customerClient.from('solicitudes').update({ selected_offer_id: offer.id, status: 'oferta_seleccionada' }).eq('id', request.id);
                    await workshopClient.from('ofertas').update({ status: 'aceptada' }).eq('id', offer.id);
                    console.log(`  > Offer accepted`);

                    if (rand > 0.85) {
                        // Move to Shipment
                        await workshopClient.from('solicitudes').update({ status: 'en_camino_taller' }).eq('id', request.id);

                        // Create Shipment
                        // Using correct schema fields
                        await workshopClient.from('shipments').insert({
                            solicitud_id: request.id,
                            tracking_number: `ES${Math.floor(Math.random() * 100000)}0${Math.floor(Math.random() * 9)}`,
                            type: 'to_workshop',
                            status: 'in_transit',
                            origin_name: USERS.client.name,
                            origin_city: 'Madrid',
                            destination_name: USERS.workshop.workshop_name,
                            destination_city: USERS.workshop.workshop_city
                        });
                        console.log(`  > Shipment created`);
                    }
                }
            }
        }
    }
    console.log("Done!");
}

main().catch(console.error);
