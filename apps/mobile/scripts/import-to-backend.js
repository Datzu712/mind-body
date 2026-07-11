/**
 * Import Samsung Health CSV data directly to the backend API.
 * Groups granular records into daily summaries and upserts via batch endpoint.
 *
 * Usage: API_URL=http://... TOKEN=<jwt> node scripts/import-to-backend.js
 */

const fs = require('fs');
const path = require('path');

const API_URL = 'http://192.168.68.90:3000';
const TOKEN =
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJxbDh5cF9rTGd5U1ZhTVZBQTBqWnNhMk9MWUJacHVlNUVFOW1tVXNNVW9rIn0.eyJleHAiOjE3ODE4OTY1MDUsImlhdCI6MTc4MTg5NjIwNSwiYXV0aF90aW1lIjoxNzgxODg5NjM2LCJqdGkiOiJvZnJ0cnQ6NTA0Njk5NDMtNjEyYS04NTY5LTM0MGItNWViZDY1ZGViMTBiIiwiaXNzIjoiaHR0cDovLzE5Mi4xNjguNjguOTA6ODA4MC9yZWFsbXMvbWFiIiwiYXVkIjpbInJlc3RhcGkiLCJhY2NvdW50Il0sInN1YiI6IjY2MjBmZjdmLTJkNGYtNGQyZi05MzBkLWNiODdmMTc3MGI5OCIsInR5cCI6IkJlYXJlciIsImF6cCI6Im1vYmlsZSIsInNpZCI6InFlSnQ2bnA2WWhOZFBHZG9ZdnJtTFNlZyIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsImRlZmF1bHQtcm9sZXMtbWFiIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBvZmZsaW5lX2FjY2VzcyBlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJKdWFuIEVzdGViYW4gU8OhbmNoZXogIiwicHJlZmVycmVkX3VzZXJuYW1lIjoianVhbkBtZWRkeWcuY29tIiwiZ2l2ZW5fbmFtZSI6Ikp1YW4gRXN0ZWJhbiIsImZhbWlseV9uYW1lIjoiU8OhbmNoZXogIiwiZW1haWwiOiJqdWFuQG1lZGR5Zy5jb20ifQ.qBgTxvJY2g1EKccCD3Awk3CDuDE6eR8jexZxbr7-QLWdm7Z6DCEnyyYhe67dJVlYvB-hjBAHlvcJv_1sV8QKFgw3MKRBCNGLPQuUHvYz6ufMLtECqoYgUV3v1yndcSbgGoHDnfijKE2S-NUDLqpI_VFMRQeOJ83tMmvuzm_ajHEP5yBP2qst4yoNgwctRCfJFbutM07weTKwAWRmiXzhzzGhxeKHxmHS7UvSuSe-rKeG7YSXd2npcQwwKrb6fRGtCTmcSEh7nyC6l-tPnzTgNnypu5xx6NeiWsTqCwRtLbg49DJWhB4Q7foUrAvMN74l7qCY5oTNhqjCiekWeCwOYQ';
if (!API_URL || !TOKEN) {
    console.error('Usage: API_URL=http://... TOKEN=<jwt> node scripts/import-to-backend.js');
    process.exit(1);
}

const DIR = path.join(__dirname, '../datasets/samsunghealth_41zohan_20260619120083');

function readCSV(filename) {
    const raw = fs.readFileSync(path.join(DIR, filename), 'utf8').replace(/^\uFEFF/, '');
    const lines = raw.split('\n');
    const headers = lines[1].split(',');
    const rows = [];
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',');
        const row = {};
        headers.forEach((h, idx) => (row[h] = cols[idx] || ''));
        rows.push(row);
    }
    return rows;
}

// The timestamps in Samsung Health CSVs are already in local time (Costa Rica UTC-6)
function localDateKey(timeStr) {
    if (!timeStr) return null;
    return timeStr.slice(0, 10);
}

// ── Aggregate by day ──────────────────────────────────────────────────────────

const days = new Map();
function ensure(dateKey) {
    if (!days.has(dateKey)) {
        days.set(dateKey, { steps: 0, caloriesTotal: 0, activeMinutes: 0, exerciseCount: 0, distanceMeters: 0 });
    }
    return days.get(dateKey);
}

// Steps
const stepRows = readCSV('com.samsung.shealth.tracker.pedometer_step_count.20260619120083.csv');
for (const r of stepRows) {
    const count = parseInt(r['com.samsung.health.step_count.count']) || 0;
    if (count <= 0) continue;
    const dateKey = localDateKey(r['com.samsung.health.step_count.start_time']);
    if (!dateKey) continue;
    ensure(dateKey).steps += count;
}

// Calories (daily summaries)
const calRows = readCSV('com.samsung.shealth.calories_burned.details.20260619120083.csv');
for (const r of calRows) {
    const rest = parseFloat(r['com.samsung.shealth.calories_burned.rest_calorie']) || 0;
    const active = parseFloat(r['com.samsung.shealth.calories_burned.active_calorie']) || 0;
    const total = rest + active;
    const dayMs = parseInt(r['com.samsung.shealth.calories_burned.day_time']);
    if (!dayMs || total <= 0) continue;
    // Convert epoch ms to local date in Costa Rica (UTC-6)
    const d = new Date(dayMs + -6 * 3600 * 1000);
    const dateKey = d.toISOString().slice(0, 10);
    const day = ensure(dateKey);
    // Keep the highest calorie value per day (there can be duplicate rows per device)
    day.caloriesTotal = Math.max(day.caloriesTotal, Math.round(total * 100) / 100);
}

// Exercise (all walking/1001)
const exRows = readCSV('com.samsung.shealth.exercise.20260619120083.csv');
for (const r of exRows) {
    const startTime = r['com.samsung.health.exercise.start_time'];
    if (!startTime) continue;
    const dateKey = localDateKey(startTime);
    if (!dateKey) continue;
    const durationMs = parseInt(r['com.samsung.health.exercise.duration']) || 0;
    const dist = parseFloat(r['com.samsung.health.exercise.distance']) || 0;
    const day = ensure(dateKey);
    day.exerciseCount++;
    day.activeMinutes += Math.round(durationMs / 60000);
    day.distanceMeters += Math.round(dist * 100) / 100;
}

// ── Send to backend ───────────────────────────────────────────────────────────

async function main() {
    const items = [];
    for (const [date, d] of days) {
        items.push({
            date,
            steps: d.steps,
            caloriesTotal: d.caloriesTotal,
            activeMinutes: d.activeMinutes,
            exerciseCount: d.exerciseCount,
            distanceMeters: d.distanceMeters,
            source: 'HEALTH_CONNECT',
        });
    }

    items.sort((a, b) => a.date.localeCompare(b.date));
    console.log(`Importing ${items.length} daily summaries (${items[0].date} → ${items[items.length - 1].date})`);

    // Batch in chunks of 90
    for (let i = 0; i < items.length; i += 90) {
        const batch = items.slice(i, i + 90);
        const res = await fetch(`${API_URL}/api/v1/activity/daily/batch`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${TOKEN}`,
            },
            body: JSON.stringify({ items: batch }),
        });

        if (!res.ok) {
            console.error(`Batch failed (${i}-${i + batch.length}):`, res.status, await res.text());
            process.exit(1);
        }

        console.log(
            `  Batch ${Math.floor(i / 90) + 1}: ${batch.length} days (${batch[0].date} → ${batch[batch.length - 1].date})`,
        );
    }

    console.log('Done!');
}

main().catch(console.error);
