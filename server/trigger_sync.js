
import { syncArticlesToFirestore } from './firestoreSync.js';
console.log('Starting manual sync...');
syncArticlesToFirestore().then(() => {
    console.log('Sync finished.');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
