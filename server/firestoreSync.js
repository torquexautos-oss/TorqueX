/**
 * firestoreSync.js — Server-side background job
 *
 * Uses the Firebase Admin SDK to write all RSS feed articles to Firestore
 * every 15 minutes, completely independent of any user visiting the site.
 *
 * This ensures every article URL is always shareable (even before the first
 * user visits) and that comments are attached to consistent, stable document IDs.
 *
 * Setup:
 *   1. Go to Firebase Console → Project Settings → Service Accounts
 *   2. Click "Generate new private key" → download the JSON file
 *   3. Save it as server/serviceAccountKey.json  (it's gitignored)
 *   4. The sync will activate automatically on server start.
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fetchMultipleChannels, CHANNELS } from './rssParser.js';
import { createRequire } from 'module';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Firebase Admin Init ──────────────────────────────────────────────────────
// We only initialise once (important in hot-reload dev environments)
let adminDb = null;

const initAdmin = () => {
    if (adminDb) return adminDb; // already initialised

    const keyPath = path.join(__dirname, 'serviceAccountKey.json');

    if (!existsSync(keyPath)) {
        console.warn('[FirestoreSync] serviceAccountKey.json not found. Article sync disabled.');
        console.warn('[FirestoreSync] To enable: download your service account key from Firebase Console');
        console.warn('[FirestoreSync] → Project Settings → Service Accounts → Generate new private key');
        console.warn('[FirestoreSync] → Save as server/serviceAccountKey.json');
        return null;
    }

    try {
        // Prevent duplicate app init (e.g., in dev mode with hot reload)
        if (getApps().length === 0) {
            const require = createRequire(import.meta.url);
            const serviceAccount = require('./serviceAccountKey.json');
            initializeApp({ credential: cert(serviceAccount) });
        }
        adminDb = getFirestore();
        adminDb.settings({ ignoreUndefinedProperties: true });
        console.log('[FirestoreSync] Firebase Admin SDK initialised ✓');
        return adminDb;
    } catch (err) {
        console.error('[FirestoreSync] Failed to init Admin SDK:', err.message);
        return null;
    }
};

// ── Core Sync Function ────────────────────────────────────────────────────────
/**
 * Fetches all RSS channels and writes every article to Firestore in batches.
 * Uses merge writes so existing docs (with comments, etc.) are never clobbered.
 */
export const syncArticlesToFirestore = async () => {
    const db = initAdmin();
    if (!db) return;

    const allChannelIds = Object.keys(CHANNELS);
    console.log(`[FirestoreSync] Syncing ${allChannelIds.length} channels to Firestore...`);

    try {
        const articles = await fetchMultipleChannels(allChannelIds);
        if (!articles.length) {
            console.warn('[FirestoreSync] No articles returned from RSS feeds.');
            return;
        }

        // Firestore batch writes are limited to 500 operations each
        const BATCH_SIZE = 400;
        let written = 0;

        for (let i = 0; i < articles.length; i += BATCH_SIZE) {
            const batch = db.batch();
            const chunk = articles.slice(i, i + BATCH_SIZE);

            for (const article of chunk) {
                if (!article?.id || !article?.url) continue;
                const ref = db.collection('feed_articles').doc(article.id);
                batch.set(ref, {
                    id: article.id,
                    title: article.title || '',
                    url: article.url || '',
                    source: article.source || '',
                    sourceIcon: article.sourceIcon || null,
                    publishedAt: article.publishedAt || null,
                    description: article.description || '',
                    imageUrl: article.imageUrl || null,
                    category: article.category || '',
                    channelId: article.channelId || '',
                    updatedAt: new Date().toISOString(),
                }, { merge: true }); // merge: true preserves comment counts etc.
                written++;
            }

            await batch.commit();
        }

        console.log(`[FirestoreSync] ✓ Synced ${written} articles to Firestore`);
    } catch (err) {
        console.error('[FirestoreSync] Sync failed:', err.message);
    }
};

// ── Scheduler ─────────────────────────────────────────────────────────────────
const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes (matches RSS cache TTL)

/**
 * Start the background sync. Runs immediately on startup, then every 15 minutes.
 * Call this once from server/index.js after everything else is initialised.
 */
export const startArticleSync = () => {
    const db = initAdmin();
    if (!db) {
        console.warn('[FirestoreSync] Skipping sync scheduler (no service account key).');
        return;
    }

    // Run immediately on startup so Firestore is populated right away
    syncArticlesToFirestore();

    // Then repeat every 15 minutes
    setInterval(syncArticlesToFirestore, SYNC_INTERVAL_MS);
    console.log(`[FirestoreSync] Scheduler started — syncing every ${SYNC_INTERVAL_MS / 60000} minutes`);
};
