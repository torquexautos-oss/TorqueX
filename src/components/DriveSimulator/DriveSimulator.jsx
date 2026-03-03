import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Square, Gauge, Zap, Wind, Clock, Activity } from 'lucide-react';
import './DriveSimulator.css';

export default function DriveSimulator({ carName, powerBhp = 100, engineCc = 1000, fuelType = 'Petrol', topSpeed: propTopSpeed, onClose }) {
    const [simulating, setSimulating] = useState(false);
    const [speed, setSpeed] = useState(0);
    const [rpm, setRpm] = useState(800);
    const [gear, setGear] = useState(0); // 0 = N, 1-6 = gears
    const [gForce, setGForce] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [reachedMax, setReachedMax] = useState(false);

    const audioCtxRef = useRef(null);
    const oscillatorRef = useRef(null);
    const gainNodeRef = useRef(null);
    const animationRef = useRef(null);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    // ── Physics ──────────────────────────────────────────────────
    const isEV = fuelType?.toLowerCase() === 'electric';
    const isDiesel = fuelType?.toLowerCase() === 'diesel';
    const isBigEngine = powerBhp >= 200 || engineCc >= 2000;

    const maxSpeed = propTopSpeed || (isEV
        ? Math.min(200, Math.floor(120 + (powerBhp * 0.3)))
        : Math.min(320, Math.floor(130 + (powerBhp * 0.35))));

    const accelerationRamp = Math.max(0.5, Math.min(powerBhp / 120, 5));
    const maxRPM = isEV ? 0 : (isBigEngine ? 7500 : (isDiesel ? 5000 : 6500));

    // Gear shift points
    const gearShiftPoints = isEV ? [] : [
        0,
        maxSpeed * 0.15,
        maxSpeed * 0.30,
        maxSpeed * 0.50,
        maxSpeed * 0.70,
        maxSpeed * 0.85,
    ];

    const totalGears = isEV ? 1 : 6;

    // ── Audio ────────────────────────────────────────────────────
    const initAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (isEV) {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
        } else if (isDiesel) {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(45, ctx.currentTime);
            const sub = ctx.createOscillator();
            sub.type = 'square';
            sub.frequency.setValueAtTime(22.5, ctx.currentTime);
            sub.connect(gain);
            sub.start();
            osc._sub = sub;
        } else if (isBigEngine) {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(50, ctx.currentTime);
            const sub = ctx.createOscillator();
            sub.type = 'square';
            sub.frequency.setValueAtTime(25, ctx.currentTime);
            sub.connect(gain);
            sub.start();
            osc._sub = sub;
        } else {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(60, ctx.currentTime);
            const sub = ctx.createOscillator();
            sub.type = 'sawtooth';
            sub.frequency.setValueAtTime(60, ctx.currentTime);
            sub.connect(gain);
            sub.start();
            osc._sub = sub;
        }

        gain.gain.setValueAtTime(0, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscillatorRef.current = osc;
        gainNodeRef.current = gain;
    }, [isEV, isDiesel, isBigEngine]);

    const cleanupAudio = useCallback(() => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (timerRef.current) clearInterval(timerRef.current);

        if (gainNodeRef.current && audioCtxRef.current) {
            gainNodeRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.3);
        }
        setTimeout(() => {
            try {
                if (oscillatorRef.current) {
                    oscillatorRef.current.stop();
                    if (oscillatorRef.current._sub) oscillatorRef.current._sub.stop();
                    oscillatorRef.current.disconnect();
                    oscillatorRef.current = null;
                }
            } catch { /* already stopped */ }
        }, 400);
    }, []);

    useEffect(() => {
        return () => cleanupAudio();
    }, [cleanupAudio]);

    // Close on Escape
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // ── Simulation ───────────────────────────────────────────────
    const startSimulation = () => {
        setSimulating(true);
        setReachedMax(false);
        setSpeed(0);
        setRpm(800);
        setGear(isEV ? 1 : 1);
        setGForce(0);
        setElapsed(0);
        initAudio();

        const ctx = audioCtxRef.current;
        const osc = oscillatorRef.current;
        const gain = gainNodeRef.current;

        const targetVol = isBigEngine ? 0.5 : (isEV ? 0.25 : 0.35);
        gain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 0.8);

        startTimeRef.current = performance.now();
        timerRef.current = setInterval(() => {
            setElapsed(prev => prev + 0.1);
        }, 100);

        let currentSpeed = 0;
        let lastSpeed = 0;
        let lastTime = performance.now();

        const animate = (time) => {
            const dt = (time - lastTime) / 1000;
            lastTime = time;

            if (currentSpeed < maxSpeed) {
                const drag = (maxSpeed - currentSpeed) / maxSpeed;
                const acc = (maxSpeed * 0.4) * dt * accelerationRamp * drag;
                currentSpeed = Math.min(currentSpeed + acc, maxSpeed);

                // G-force (simplified: acceleration / 9.8)
                const deltaV = (currentSpeed - lastSpeed) / 3.6; // m/s
                const gf = Math.abs(deltaV / dt) / 9.8;
                setGForce(Math.min(gf, 2.0));
                lastSpeed = currentSpeed;

                // Gear calculation
                if (!isEV) {
                    let currentGear = 1;
                    for (let i = gearShiftPoints.length - 1; i >= 1; i--) {
                        if (currentSpeed >= gearShiftPoints[i]) {
                            currentGear = i + 1;
                            break;
                        }
                    }
                    currentGear = Math.min(currentGear, totalGears);
                    setGear(currentGear);

                    // RPM from gear & speed
                    const gearMin = gearShiftPoints[currentGear - 1] || 0;
                    const gearMax = gearShiftPoints[currentGear] || maxSpeed;
                    const posInGear = (currentSpeed - gearMin) / (gearMax - gearMin);
                    const calcRpm = Math.round(1200 + posInGear * (maxRPM - 1200));
                    setRpm(Math.min(calcRpm, maxRPM));

                    // Audio frequency
                    const baseFreq = isDiesel ? 45 : (isBigEngine ? 50 : 60);
                    const freqMulti = isDiesel ? 1.5 : (isBigEngine ? 2 : 2.5);
                    const freq = baseFreq + (currentSpeed * freqMulti);
                    osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.08);
                    if (osc._sub) osc._sub.frequency.setTargetAtTime(freq / (isBigEngine ? 2 : 1), ctx.currentTime, 0.08);
                } else {
                    const freq = 150 + (currentSpeed * 6);
                    osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.08);
                    setGear(1);
                    setRpm(0);
                }

                setSpeed(Math.round(currentSpeed));
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setSpeed(maxSpeed);
                setGForce(0);
                setReachedMax(true);
                gain.gain.setTargetAtTime(0, ctx.currentTime, 2);
                clearInterval(timerRef.current);
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    const stopSimulation = () => {
        cleanupAudio();
        setSimulating(false);
        setSpeed(0);
        setRpm(800);
        setGear(0);
        setGForce(0);
        setElapsed(0);
        setReachedMax(false);
    };

    // ── Gauge Helpers ────────────────────────────────────────────
    const speedPercent = speed / maxSpeed;
    const rpmPercent = isEV ? speedPercent : (rpm / maxRPM);

    // Arc gauge math (240° arc, starts at 150° ends at 390°)
    const ARC_START = 150;
    const ARC_SWEEP = 240;
    const RADIUS = 88;
    const CX = 100;
    const CY = 100;

    const polarToCart = (cx, cy, r, angleDeg) => {
        const rad = (angleDeg * Math.PI) / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };

    const describeArc = (pct) => {
        const endAngle = ARC_START + (ARC_SWEEP * pct);
        const start = polarToCart(CX, CY, RADIUS, ARC_START);
        const end = polarToCart(CX, CY, RADIUS, endAngle);
        const largeArc = (endAngle - ARC_START) > 180 ? 1 : 0;
        return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
    };

    const trackArc = describeArc(1);
    const speedArc = describeArc(speedPercent);

    // Speed color
    const getSpeedColor = () => {
        if (isEV) return speedPercent > 0.8 ? '#10b981' : '#34d399';
        if (speedPercent < 0.3) return '#3b82f6';
        if (speedPercent < 0.6) return '#f59e0b';
        if (speedPercent < 0.85) return '#ef4444';
        return '#dc2626';
    };

    // ── Visuals ─────────────────────────────────────────────────
    const [speedLines] = useState(() => {
        return [...Array(20)].map((_, i) => ({
            id: i,
            duration: 0.3 + Math.random() * 0.7,
            left: Math.random() * 100,
            top: Math.random() * 100,
            delay: Math.random() * 0.5
        }));
    });

    const speedColor = getSpeedColor();

    return (
        <div className="sim-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            {/* Background speed lines */}
            {simulating && (
                <div className="sim-speed-lines" style={{ opacity: Math.min(speedPercent, 0.6) }}>
                    {speedLines.map((line) => (
                        <div key={line.id} className="speed-line" style={{
                            animationDuration: `${line.duration}s`,
                            left: `${line.left}%`,
                            top: `${line.top}%`,
                            animationDelay: `${line.delay}s`,
                        }} />
                    ))}
                </div>
            )}

            <div className="sim-dashboard">
                <button className="sim-close" onClick={onClose}><X size={20} /></button>

                <div className="sim-header">
                    <Activity size={18} className="sim-header-icon" />
                    <div>
                        <h2>Drive Feel Simulator</h2>
                        <p>{carName}</p>
                    </div>
                </div>

                <div className="sim-main">
                    {/* Speedometer */}
                    <div className="sim-speedo-container">
                        <svg viewBox="0 0 200 200" className="sim-speedo-svg">
                            {/* Track */}
                            <path d={trackArc} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
                            {/* Speed arc */}
                            {speed > 0 && (
                                <path d={speedArc} fill="none" stroke={speedColor} strokeWidth="8" strokeLinecap="round"
                                    style={{ transition: 'stroke 0.3s' }} />
                            )}
                            {/* Tick marks */}
                            {[...Array(13)].map((_, i) => {
                                const angle = ARC_START + (ARC_SWEEP * i / 12);
                                const inner = polarToCart(CX, CY, RADIUS - 12, angle);
                                const outer = polarToCart(CX, CY, RADIUS - 6, angle);
                                const labelPos = polarToCart(CX, CY, RADIUS - 22, angle);
                                const speedLabel = Math.round((maxSpeed / 12) * i);
                                return (
                                    <g key={i}>
                                        <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                                            stroke="rgba(255,255,255,0.2)" strokeWidth={i % 3 === 0 ? 2 : 1} />
                                        {i % 3 === 0 && (
                                            <text x={labelPos.x} y={labelPos.y} fill="rgba(255,255,255,0.3)"
                                                fontSize="7" textAnchor="middle" dominantBaseline="central">
                                                {speedLabel}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>
                        <div className="sim-speedo-readout">
                            <span className="sim-speed-val" style={{ color: speedColor }}>{speed}</span>
                            <span className="sim-speed-unit">km/h</span>
                        </div>
                    </div>

                    {/* Metrics row */}
                    <div className="sim-metrics">
                        {/* Gear */}
                        <div className="sim-metric">
                            <span className="sim-metric-label">Gear</span>
                            <span className="sim-metric-value gear-value">
                                {isEV ? 'D' : (gear === 0 ? 'N' : gear)}
                            </span>
                        </div>

                        {/* RPM */}
                        {!isEV && (
                            <div className="sim-metric">
                                <span className="sim-metric-label">RPM</span>
                                <span className="sim-metric-value">{rpm.toLocaleString()}</span>
                                <div className="sim-rpm-bar">
                                    <div className="sim-rpm-fill" style={{
                                        width: `${rpmPercent * 100}%`,
                                        background: rpmPercent > 0.85 ? '#ef4444' : rpmPercent > 0.6 ? '#f59e0b' : '#3b82f6'
                                    }} />
                                </div>
                            </div>
                        )}

                        {/* G-Force */}
                        <div className="sim-metric">
                            <span className="sim-metric-label">G-Force</span>
                            <span className="sim-metric-value">{gForce.toFixed(2)}g</span>
                        </div>

                        {/* Timer */}
                        <div className="sim-metric">
                            <span className="sim-metric-label">Time</span>
                            <span className="sim-metric-value">{elapsed.toFixed(1)}s</span>
                        </div>
                    </div>

                    {/* Car specs strip */}
                    <div className="sim-specs-strip">
                        <div className="sim-spec-item">
                            <Zap size={12} />
                            <span>{powerBhp} BHP</span>
                        </div>
                        <div className="sim-spec-item">
                            <Wind size={12} />
                            <span>{isEV ? 'Electric' : `${engineCc} cc`}</span>
                        </div>
                        <div className="sim-spec-item">
                            <Gauge size={12} />
                            <span>Top: {maxSpeed} km/h</span>
                        </div>
                        <div className="sim-spec-item">
                            <Clock size={12} />
                            <span>{totalGears} {isEV ? 'Speed' : 'Gears'}</span>
                        </div>
                    </div>
                </div>

                {/* Launch / Stop button */}
                {!simulating ? (
                    <button className="sim-launch-btn" onClick={startSimulation}>
                        <Play fill="currentColor" size={18} />
                        Launch
                    </button>
                ) : reachedMax ? (
                    <button className="sim-launch-btn completed" onClick={stopSimulation}>
                        Top Speed Reached — Reset
                    </button>
                ) : (
                    <button className="sim-launch-btn stop" onClick={stopSimulation}>
                        <Square size={14} fill="currentColor" />
                        Abort
                    </button>
                )}
            </div>
        </div>
    );
}
