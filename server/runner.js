import concurrently from 'concurrently';

concurrently([
    { command: 'npm run client', name: 'Vite', prefixColor: 'blue' },
    { command: 'node --experimental-vm-modules server/index.js', name: 'Server', prefixColor: 'green' }
], {
    killOthers: ['failure'],       // Only kill if one FAILS, not if it exits cleanly
    restartTries: 3,               // Restart the server if it crashes
    restartDelay: 1000,
}).result.then(
    () => console.log('Servers shut down'),
    (err) => {
        // Don't treat server clean-exit as fatal
        const viteOk = err.some?.(e => e.command?.name === 'Vite' && e.exitCode === 0);
        if (!viteOk) console.error('Error running concurrently', err);
    }
);
