import React, { useState, useCallback, useEffect } from 'react';
import type { AnalysisReport } from './types';
import { AppState } from './types';
import UploadScreen from './components/UploadScreen';
import AnalysisScreen from './components/AnalysisScreen';
import ReportScreen from './components/ReportScreen';
import HistoryPanel from './components/HistoryPanel';
import { analyzeChatTranscript } from './services/geminiService';
import { HeartPulseIcon, FolderOpenIcon } from './components/icons/Icons';
import useLocalStorage from './hooks/useLocalStorage';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
    const [analysisResult, setAnalysisResult] = useState<AnalysisReport | null>(null);
    const [history, setHistory] = useLocalStorage<AnalysisReport[]>('relationScopeHistory', []);
    const [error, setError] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const handleStartAnalysis = useCallback(async (transcript: string, mode: 'quick' | 'deep', anonymize: boolean) => {
        setAppState(AppState.ANALYZING);
        setError(null);
        try {
            const result = await analyzeChatTranscript(transcript, mode, anonymize);
            const reportWithMeta: AnalysisReport = {
                ...result,
                meta: {
                    analysisDate: new Date().toISOString(),
                    id: `rs-${Date.now()}`,
                    fileName: "Uploaded Transcript",
                    firstMessageDate: result.timeline[0]?.period || 'N/A',
                    lastMessageDate: result.timeline[result.timeline.length - 1]?.period || 'N/A',
                }
            };
            setAnalysisResult(reportWithMeta);
            setHistory(prev => [reportWithMeta, ...prev.slice(0, 9)]); // Keep last 10 reports
            setAppState(AppState.REPORT);
        } catch (err) {
            console.error(err);
            setError('An error occurred during analysis. The AI may be experiencing high demand. Please try again later.');
            setAppState(AppState.UPLOAD);
        }
    }, [setHistory]);

    const handleReset = () => {
        setAppState(AppState.UPLOAD);
        setAnalysisResult(null);
        setError(null);
    };
    
    const viewReportFromHistory = (report: AnalysisReport) => {
        setAnalysisResult(report);
        setAppState(AppState.REPORT);
        setIsHistoryOpen(false);
    }

    const renderContent = () => {
        switch (appState) {
            case AppState.ANALYZING:
                return <AnalysisScreen />;
            case AppState.REPORT:
                return analysisResult && <ReportScreen report={analysisResult} onBack={handleReset} />;
            case AppState.UPLOAD:
            default:
                return <UploadScreen onAnalyze={handleStartAnalysis} error={error} />;
        }
    };
    
    useEffect(() => {
        // Preload background image
        const img = new Image();
        img.src = 'https://picsum.photos/seed/love/1920/1080';
    }, []);

    return (
        <div className="min-h-screen w-full bg-rose-50 text-gray-700 selection:bg-rose-200" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/subtle-zebra-3d.png')" }}>
             <HistoryPanel 
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={history}
                onViewHistory={viewReportFromHistory}
            />
            <main className="container mx-auto p-4 sm:p-6 md:p-8 relative">
                <header className="text-center mb-8 animate-fade-in-down relative">
                     <div className="flex items-center justify-center gap-4">
                        <HeartPulseIcon className="h-10 w-10 text-rose-500" />
                        <h1 className="text-4xl md:text-5xl font-bold text-rose-800 tracking-tight">
                            RelationScope
                        </h1>
                    </div>
                    <p className="mt-2 text-lg text-rose-600">
                        An Intelligent Diagnosis of Your Relationship Dynamics ❤️
                    </p>
                    <button 
                        onClick={() => setIsHistoryOpen(true)}
                        className="absolute top-0 right-0 flex items-center gap-2 px-3 py-2 bg-white/50 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors shadow-sm"
                        aria-label="Open analysis history"
                    >
                        <FolderOpenIcon className="h-5 w-5" />
                        <span className="hidden sm:inline">History</span>
                    </button>
                </header>
                {renderContent()}
            </main>
            <footer className="text-center p-4 text-rose-400 text-sm">
                <p>&copy; {new Date().getFullYear()} RelationScope. For entertainment and informational purposes only.</p>
            </footer>
        </div>
    );
};

export default App;