
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
    console.log("Checking Data...");

    const { data, error } = await supabase
        .from('solicitudes')
        .select('*')
        .eq('user_id', 'a932df32-8d21-4448-8a00-639c3a508bca')
        .limit(5);

    if (error) {
        console.error("Error:", error);
        return;
    }

    data.forEach(s => {
        console.log(`ID: ${s.id}`);
        console.log(`Images (${typeof s.images}):`, s.images);
    });
}

main().catch(console.error);
