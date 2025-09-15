
import React from 'react';
import { HeartPulseIcon } from './icons/Icons';

const AnalysisScreen: React.FC = () => {
    const messages = [
        "Analyzing communication patterns...",
        "Identifying emotional undertones...",
        "Quantifying reciprocity and effort...",
        "Scanning for key relationship phases...",
        "Building personality profiles...",
        "Cross-referencing conflict and repair cycles...",
        "Compiling your relationship snapshot..."
    ];

    const [currentMessage, setCurrentMessage] = React.useState(messages[0]);

    React.useEffect(() => {
        let index = 0;
        const intervalId = setInterval(() => {
            index = (index + 1) % messages.length;
            setCurrentMessage(messages[index]);
        }, 2500);

        return () => clearInterval(intervalId);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-white/50 rounded-2xl shadow-xl border border-rose-200 backdrop-blur-md animate-fade-in">
            <div className="relative flex items-center justify-center h-24 w-24">
                 <HeartPulseIcon className="h-16 w-16 text-rose-500 animate-ping absolute" />
                 <HeartPulseIcon className="h-16 w-16 text-rose-500" />
            </div>
            <h2 className="text-3xl font-bold text-rose-800 mt-6 mb-2 font-serif">Diagnosing Your Dynamics...</h2>
            <p className="text-rose-600 text-lg transition-opacity duration-500">{currentMessage}</p>
            <div className="w-full bg-rose-200 rounded-full h-2.5 mt-8 max-w-md">
                <div className="bg-rose-500 h-2.5 rounded-full animate-pulse" style={{ width: '100%', animation: 'loading-bar 10s ease-in-out infinite' }}></div>
            </div>
            <style>{`
                @keyframes loading-bar {
                    0% { width: 0%; }
                    25% { width: 40%; }
                    50% { width: 70%; }
                    75% { width: 90%; }
                    100% { width: 100%; }
                }
            `}</style>
            <p className="text-sm text-rose-400 mt-4">Please be patient, this can take a moment.</p>
        </div>
    );
};

export default AnalysisScreen;
