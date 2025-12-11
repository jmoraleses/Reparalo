
import { createClient } from '@supabase/supabase-js';
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Testing Upload Capability...");

    // Sign in
    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'cliente3@gmail.com',
        password: 'demo12134'
    });

    if (signInError || !session) {
        console.error("Login failed:", signInError);
        return;
    }

    console.log("Logged in as:", session.user.email);

    // Create a dummy file (buffer)
    const fileContent = Buffer.from("dummy image content");
    const fileName = `${session.user.id}/test-upload-${Date.now()}.txt`;
    // Note: RLS allows 'image/...' mimes? 
    // Migration says: ARRAY['image/jpeg', 'image/png', 'image/webp']
    // So I must mimic an image mime type.

    const { data, error } = await supabase.storage
        .from('solicitud-images')
        .upload(fileName, fileContent, {
            contentType: 'image/jpeg'
        });

    if (error) {
        console.error("Upload FAILED:", error);
    } else {
        console.log("Upload SUCCESS:", data);

        // Cleanup
        // await supabase.storage.from('solicitud-images').remove([fileName]);
    }
}

main().catch(console.error);
