import { useState, useEffect, useRef } from 'react';
import { X, Play, Loader2 } from 'lucide-react';
import './DriveSimulator.css';

export default function DriveSimulator({ carName, powerBhp = 100, engineCc = 1000, fuelType = 'Petrol', onClose }) {
    const [simulating, setSimulating] = useState(false);
    const [speed, setSpeed] = useState(0);
    const [ready, setReady] = useState(true);
    const audioCtxRef = useRef(null);
    const oscillatorRef = useRef(null);
    const gainNodeRef = useRef(null);
    const animationRef = useRef(null);

    // Dynamic Physics based on specs
    const isEV = fuelType?.toLowerCase() === 'electric';
    const isDiesel = fuelType?.toLowerCase() === 'diesel';
    const isBigEngine = powerBhp >= 200 || engineCc >= 2000;

    // Top Speed scales with BHP. E.g. ~100 BHP -> 160-180 km/h, 300 BHP -> ~240 km/h
    const maxSpeed = isEV ? Math.min(200, Math.floor(120 + (powerBhp * 0.3))) : Math.min(320, Math.floor(130 + (powerBhp * 0.35)));

    // Acceleration curve multiplier
    const accelerationRamp = Math.max(0.5, Math.min(powerBhp / 120, 5));

    // Dynamic Gear Shift Points (EVs don't shift)
    const shift1 = maxSpeed * 0.25;
    const shift2 = maxSpeed * 0.55;
    const shift3 = maxSpeed * 0.80;

    useEffect(() => {
        return () => {
            stopSimulation();
        };
    }, []);

    const initAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // ── 🏎️ Dynamic Engine Profiles Customization ──
        if (isEV) {
            // EV: Futuristic high-pitch whine
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            gain.gain.setValueAtTime(0, ctx.currentTime);
        } else if (isDiesel) {
            // Diesel: Low frequency, clattery, gritty
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(45, ctx.currentTime);
            gain.gain.setValueAtTime(0, ctx.currentTime);

            const subOsc = ctx.createOscillator();
            subOsc.type = 'square';
            subOsc.frequency.setValueAtTime(22.5, ctx.currentTime);
            subOsc.connect(gain);
            subOsc.start();
            osc._sub = subOsc;
        } else if (isBigEngine) {
            // Big Petrol V8/V6: Deep throaty rumble
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(50, ctx.currentTime);
            gain.gain.setValueAtTime(0, ctx.currentTime);

            const subOsc = ctx.createOscillator();
            subOsc.type = 'square';
            subOsc.frequency.setValueAtTime(25, ctx.currentTime);
            subOsc.connect(gain);
            subOsc.start();
            osc._sub = subOsc;
        } else {
            // Standard Small Petrol: Higher revving, smoother
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(60, ctx.currentTime);
            gain.gain.setValueAtTime(0, ctx.currentTime);

            const subOsc = ctx.createOscillator();
            subOsc.type = 'sawtooth';
            subOsc.frequency.setValueAtTime(60, ctx.currentTime);
            subOsc.connect(gain);
            subOsc.start();
            osc._sub = subOsc;
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscillatorRef.current = osc;
        gainNodeRef.current = gain;
    };

    const startSimulation = () => {
        setSimulating(true);
        initAudio();

        const ctx = audioCtxRef.current;
        const osc = oscillatorRef.current;
        const gain = gainNodeRef.current;

        // Fade in audio (loudest for big engines)
        const targetVol = isBigEngine ? 0.6 : (isEV ? 0.3 : 0.4);
        gain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 1);

        let currentSpeed = 0;
        let lastTime = performance.now();

        const animate = (time) => {
            const dt = (time - lastTime) / 1000;
            lastTime = time;

            // Speed easing physics
            if (currentSpeed < maxSpeed) {
                // The closer we get to max speed, the slower we accelerate (drag simulation)
                const drag = (maxSpeed - currentSpeed) / maxSpeed;
                currentSpeed += (maxSpeed * 0.4) * dt * accelerationRamp * drag;

                // RPM & Gear Shift Simulation
                if (!isEV) {
                    // Check if we hit a shift point (+/- 2 kmh window so we don't flutter)
                    if (currentSpeed > shift1 && currentSpeed < shift1 + 5) {
                        osc.frequency.setTargetAtTime(isDiesel ? 50 : 70, ctx.currentTime, 0.1);
                    } else if (currentSpeed > shift2 && currentSpeed < shift2 + 5) {
                        osc.frequency.setTargetAtTime(isDiesel ? 55 : 80, ctx.currentTime, 0.1);
                    } else if (currentSpeed > shift3 && currentSpeed < shift3 + 5) {
                        osc.frequency.setTargetAtTime(isDiesel ? 60 : 90, ctx.currentTime, 0.1);
                    } else {
                        // Normal RPM climb formula
                        const baseFreq = isDiesel ? 45 : (isBigEngine ? 50 : 60);
                        const freqMulti = isDiesel ? 1.5 : (isBigEngine ? 2 : 2.5);
                        const freq = baseFreq + (currentSpeed * freqMulti);
                        osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.1);
                        if (osc._sub) osc._sub.frequency.setTargetAtTime(freq / (isBigEngine ? 2 : 1), ctx.currentTime, 0.1);
                    }
                } else {
                    // EV direct drive whine
                    const freq = 150 + (currentSpeed * 6);
                    osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.1);
                }

                setSpeed(Math.round(currentSpeed));
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setSpeed(Math.round(maxSpeed));
                gain.gain.setTargetAtTime(0, ctx.currentTime, 2.5);
                setTimeout(() => stopSimulation(true), 2500);
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    const stopSimulation = (autoFinished = false) => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (gainNodeRef.current && audioCtxRef.current) {
            gainNodeRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.5);
        }

        setTimeout(() => {
            if (oscillatorRef.current) {
                oscillatorRef.current.stop();
                if (oscillatorRef.current._sub) oscillatorRef.current._sub.stop();
                oscillatorRef.current.disconnect();
                oscillatorRef.current = null;
            }
            if (!autoFinished) {
                setSimulating(false);
                setSpeed(0);
            }
        }, 500);
    };

    return (
        <div className="sim-overlay">
            {simulating && (
                <div className="sim-warp-effect" style={{ opacity: Math.min(speed / maxSpeed, 1) }}>
                    <div className="warp-lines"></div>
                </div>
            )}

            <div className="sim-dashboard">
                <button className="sim-close" onClick={onClose}><X /></button>

                <div className="sim-header">
                    <h2>Drive Feel Simulator</h2>
                    <p>{carName}</p>
                </div>

                <div className="speedometer-container">
                    <svg viewBox="0 0 200 200" className="speedometer">
                        <circle cx="100" cy="100" r="90" className="speed-track" />
                        <circle
                            cx="100" cy="100" r="90"
                            className="speed-progress"
                            style={{
                                strokeDasharray: 565,
                                strokeDashoffset: 565 - (565 * (speed / 260)),
                                stroke: isEV ? '#10b981' : '#ef4444'
                            }}
                        />
                    </svg>
                    <div className="speed-readout">
                        <span className="speed-val">{speed}</span>
                        <span className="speed-unit">km/h</span>
                    </div>
                </div>

                {!simulating ? (
                    <button className="sim-launch-btn" onClick={startSimulation}>
                        <Play fill="currentColor" size={20} />
                        Simulate Launch
                    </button>
                ) : (
                    <button className="sim-launch-btn stop" onClick={() => stopSimulation()}>
                        Abort Launch
                    </button>
                )}
            </div>
        </div>
    );
}
