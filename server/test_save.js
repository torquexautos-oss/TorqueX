
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fetchChannelFeed } from './rssParser.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function test() {
    try {
        const serviceAccount = require('./serviceAccountKey.json');
        initializeApp({ credential: cert(serviceAccount) });
        const db = getFirestore();
        const articles = await fetchChannelFeed('motorbeam');
        console.log(`Fetched ${articles.length} articles from MotorBeam`);

        for (const a of articles) {
            await db.collection('feed_articles').doc(a.id).set({
                ...a,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        }
        console.log('Saved to Firestore');
    } catch (e) {
        console.error(e);
    }
}
test();
