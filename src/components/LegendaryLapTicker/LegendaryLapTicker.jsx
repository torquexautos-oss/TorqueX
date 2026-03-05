const LAPS = [
    { track: 'NÜRBURGRING', car: '911 GT2 RS', time: '06:43.30' },
    { track: 'PIKES PEAK', car: 'VWP I.D. R', time: '07:57.14' },
    { track: 'SPA-FRANCORCHAMPS', car: 'AMG ONE', time: '02:07.60' },
    { track: 'SUZUKA', car: 'GT-R NISMO', time: '02:00.31' },
    { track: 'LAGUNA SECA', car: 'CZINGER 21C', time: '01:20.01' },
];

export default function LegendaryLapTicker() {
    return (
        <div className="lap-ticker-container">
            <div className="ticker-label">LATEST_TRACK_RECORDS:</div>
            <div className="ticker-content">
                <div className="ticker-track">
                    {[...LAPS, ...LAPS].map((lap, i) => (
                        <div key={i} className="lap-item">
                            <span className="lap-track">{lap.track}</span>
                            <span className="lap-car">{lap.car}</span>
                            <span className="lap-time">{lap.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
