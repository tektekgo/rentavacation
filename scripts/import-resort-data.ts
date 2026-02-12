/**
 * Resort Master Data Import Script
 *
 * Bulk imports 117 resorts and 351 unit types from complete-resort-data.json
 * into Supabase (DEV or PROD).
 *
 * Usage:
 *   npx tsx scripts/import-resort-data.ts
 *
 * Environment variables required:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (needed to bypass RLS)
 *
 * Or use .env file values:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY (note: anon key may be blocked by RLS for inserts)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment from .env.local
for (const envFile of ['.env.local', '.env']) {
  const envPath = path.resolve(__dirname, '..', envFile);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        if (!process.env[key]) {
          process.env[key] = match[2].trim();
        }
      }
    });
  }
}

// Supabase client setup - prefer service role key for bypassing RLS
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Load resort data
const dataPath = path.resolve(__dirname, '..', 'docs', 'features', 'resort-master-data', 'sample-data', 'complete-resort-data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const resortData = JSON.parse(rawData);

console.log(`Loaded ${resortData.resorts.length} resorts and ${resortData.unit_types.length} unit types`);

async function importResorts() {
  console.log('\n--- Step 1: Importing Resorts ---');

  // Check for existing resorts
  const { count: existingCount } = await supabase
    .from('resorts')
    .select('*', { count: 'exact', head: true });

  if (existingCount && existingCount > 0) {
    console.log(`Found ${existingCount} existing resorts. Skipping resort import.`);
    console.log('To re-import, delete existing data first.');

    // Return existing resorts for unit type mapping
    const { data: existingResorts } = await supabase
      .from('resorts')
      .select('id, resort_name');
    return existingResorts;
  }

  // Bulk insert all 117 resorts
  // Supabase handles batching internally for large inserts
  const { data: insertedResorts, error } = await supabase
    .from('resorts')
    .insert(resortData.resorts)
    .select('id, resort_name');

  if (error) {
    console.error('Error importing resorts:', error.message);

    // If bulk fails, try in smaller batches
    if (error.message.includes('too many')) {
      console.log('Trying batch import (20 at a time)...');
      return await importResortsBatched();
    }
    process.exit(1);
  }

  console.log(`Imported ${insertedResorts!.length} resorts`);
  return insertedResorts;
}

async function importResortsBatched() {
  const batchSize = 20;
  const allInserted: Array<{ id: string; resort_name: string }> = [];

  for (let i = 0; i < resortData.resorts.length; i += batchSize) {
    const batch = resortData.resorts.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('resorts')
      .insert(batch)
      .select('id, resort_name');

    if (error) {
      console.error(`Error in batch ${i / batchSize + 1}:`, error.message);
      process.exit(1);
    }

    allInserted.push(...data!);
    console.log(`  Batch ${Math.floor(i / batchSize) + 1}: ${data!.length} resorts`);
  }

  console.log(`Imported ${allInserted.length} resorts (batched)`);
  return allInserted;
}

async function importUnitTypes(insertedResorts: Array<{ id: string; resort_name: string }>) {
  console.log('\n--- Step 2: Importing Unit Types ---');

  // Check for existing unit types
  const { count: existingCount } = await supabase
    .from('resort_unit_types')
    .select('*', { count: 'exact', head: true });

  if (existingCount && existingCount > 0) {
    console.log(`Found ${existingCount} existing unit types. Skipping import.`);
    return;
  }

  // Create resort_name -> id mapping
  const resortMap = new Map<string, string>();
  insertedResorts.forEach(r => resortMap.set(r.resort_name, r.id));

  // Transform unit types with resort_id
  const unitTypesWithIds = resortData.unit_types.map((ut: any) => {
    const resortId = resortMap.get(ut.resort_name);
    if (!resortId) {
      console.warn(`Warning: No resort found for "${ut.resort_name}"`);
      return null;
    }
    return {
      resort_id: resortId,
      unit_type_name: ut.unit_type_name,
      bedrooms: ut.bedrooms,
      bathrooms: ut.bathrooms,
      max_occupancy: ut.max_occupancy,
      square_footage: ut.square_footage,
      kitchen_type: ut.kitchen_type,
      bedding_config: ut.bedding_config,
      features: ut.features,
      unit_amenities: ut.unit_amenities,
    };
  }).filter(Boolean);

  console.log(`Prepared ${unitTypesWithIds.length} unit types for import`);

  // Bulk insert in batches of 50
  const batchSize = 50;
  let totalInserted = 0;

  for (let i = 0; i < unitTypesWithIds.length; i += batchSize) {
    const batch = unitTypesWithIds.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('resort_unit_types')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`Error in unit type batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      process.exit(1);
    }

    totalInserted += data!.length;
    console.log(`  Batch ${Math.floor(i / batchSize) + 1}: ${data!.length} unit types`);
  }

  console.log(`Imported ${totalInserted} unit types`);
}

async function verifyData() {
  console.log('\n--- Step 3: Verification ---');

  // Count by brand
  const { data: brandCounts } = await supabase
    .from('resorts')
    .select('brand');

  const counts: Record<string, number> = {};
  brandCounts?.forEach(r => {
    counts[r.brand] = (counts[r.brand] || 0) + 1;
  });

  console.log('Resort counts by brand:');
  Object.entries(counts).forEach(([brand, count]) => {
    console.log(`  ${brand}: ${count}`);
  });

  // Total unit types
  const { count: unitCount } = await supabase
    .from('resort_unit_types')
    .select('*', { count: 'exact', head: true });

  console.log(`Total unit types: ${unitCount}`);

  // Sample query: resorts with unit type counts
  const { data: sample } = await supabase
    .from('resorts')
    .select(`
      resort_name,
      brand,
      resort_unit_types(count)
    `)
    .eq('brand', 'hilton_grand_vacations')
    .limit(5);

  console.log('\nSample: First 5 Hilton resorts with unit type counts:');
  sample?.forEach((r: any) => {
    const utCount = r.resort_unit_types?.[0]?.count || 0;
    console.log(`  ${r.resort_name}: ${utCount} unit types`);
  });

  // Verify expected counts
  const totalResorts = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log('\n--- Verification Results ---');
  console.log(`Resorts: ${totalResorts} (expected: 117) ${totalResorts === 117 ? 'PASS' : 'MISMATCH'}`);
  console.log(`Unit Types: ${unitCount} (expected: 351) ${unitCount === 351 ? 'PASS' : 'MISMATCH'}`);
  console.log(`Hilton: ${counts['hilton_grand_vacations'] || 0} (expected: 62) ${counts['hilton_grand_vacations'] === 62 ? 'PASS' : 'MISMATCH'}`);
  console.log(`Marriott: ${counts['marriott_vacation_club'] || 0} (expected: 40) ${counts['marriott_vacation_club'] === 40 ? 'PASS' : 'MISMATCH'}`);
  console.log(`Disney: ${counts['disney_vacation_club'] || 0} (expected: 15) ${counts['disney_vacation_club'] === 15 ? 'PASS' : 'MISMATCH'}`);
}

async function main() {
  console.log('=== Resort Master Data Import ===');
  console.log(`Target: ${supabaseUrl}`);
  console.log(`Using: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role key' : 'anon key'}`);

  const startTime = Date.now();

  const insertedResorts = await importResorts();
  if (!insertedResorts) {
    console.error('No resorts returned from import. Aborting.');
    process.exit(1);
  }

  await importUnitTypes(insertedResorts);
  await verifyData();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s`);
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
