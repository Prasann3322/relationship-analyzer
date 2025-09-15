import React, { useState, useCallback, useMemo } from 'react';
import { FileUpIcon, BrainCircuitIcon, FileTextIcon, AlertTriangleIcon, ZapIcon } from './icons/Icons';

interface UploadScreenProps {
    onAnalyze: (transcript: string, mode: 'quick' | 'deep', anonymize: boolean) => void;
    error: string | null;
}

const MAX_CHARS_WARNING = 3000000;

const UploadScreen: React.FC<UploadScreenProps> = ({ onAnalyze, error }) => {
    const [transcript, setTranscript] = useState('');
    const [fileName, setFileName] = useState('');
    const [anonymize, setAnonymize] = useState(true);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setTranscript(text);
            };
            reader.readAsText(file);
        }
    }, []);

    const handleAnalyzeClick = useCallback((mode: 'quick' | 'deep') => {
        if (transcript.trim()) {
            onAnalyze(transcript, mode, anonymize);
        }
    }, [transcript, anonymize, onAnalyze]);

    const isTranscriptTooLong = useMemo(() => transcript.length > MAX_CHARS_WARNING, [transcript.length]);

    return (
        <div className="space-y-8 animate-fade-in-up max-w-4xl mx-auto">
            <div className="bg-white/60 p-8 rounded-3xl shadow-xl border border-rose-200 backdrop-blur-md text-center">
                <h2 className="text-3xl font-bold text-rose-800 mb-4 font-serif">Begin Your Analysis</h2>
                <p className="text-rose-700 mb-6 max-w-2xl mx-auto">Paste your chat history or upload a .txt file. Your data is processed securely and is never stored on our servers.</p>

                <div className="max-w-xl mx-auto">
                    <textarea
                        className="w-full h-48 p-4 border border-rose-200 rounded-lg bg-rose-50/50 focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition-all duration-300 placeholder-rose-400"
                        placeholder="Paste your chat transcript here..."
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        aria-label="Chat transcript input"
                    />
                    {isTranscriptTooLong && (
                        <div className="mt-2 text-left text-sm text-yellow-700 bg-yellow-100/70 border border-yellow-200 p-3 rounded-lg flex items-start gap-2">
                            <AlertTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <span>This transcript is very long. To ensure a successful analysis, only the most recent part of the conversation will be used.</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between mt-4">
                        <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-rose-300 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors">
                            <FileUpIcon className="h-5 w-5" />
                            <span className="truncate max-w-xs">{fileName || 'Upload .txt file'}</span>
                        </label>
                        <input id="file-upload" type="file" className="hidden" accept=".txt" onChange={handleFileChange} />
                        
                        <div className="flex items-center gap-2">
                             <label htmlFor="anonymize-toggle" className="text-sm text-rose-700 cursor-pointer">Anonymize Names</label>
                            <button
                                id="anonymize-toggle"
                                onClick={() => setAnonymize(!anonymize)}
                                role="switch"
                                aria-checked={anonymize}
                                className={`${anonymize ? 'bg-rose-500' : 'bg-rose-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                            >
                                <span className={`${anonymize ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                    <button
                        onClick={() => handleAnalyzeClick('quick')}
                        disabled={!transcript.trim()}
                        className="flex flex-col items-center gap-2 p-4 bg-rose-400 text-white font-semibold rounded-lg shadow-md hover:bg-rose-500 disabled:bg-rose-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                    >
                        <ZapIcon className="h-6 w-6" />
                        <span>Quick Analysis</span>
                        <span className="text-xs font-normal opacity-80">Fast, high-level insights</span>
                    </button>
                    <button
                        onClick={() => handleAnalyzeClick('deep')}
                        disabled={!transcript.trim()}
                        className="flex flex-col items-center gap-2 p-4 bg-rose-600 text-white font-semibold rounded-lg shadow-md hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                    >
                        <BrainCircuitIcon className="h-6 w-6" />
                        <span>Deep Analysis</span>
                        <span className="text-xs font-normal opacity-80">Detailed, comprehensive report</span>
                    </button>
                </div>
                 {error && <p className="text-red-600 mt-6">{error}</p>}
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="bg-white/50 p-4 rounded-2xl shadow-lg backdrop-blur-sm border border-rose-100">
                    <FileUpIcon className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-rose-800">1. Upload</h3>
                    <p className="text-sm text-rose-700/90">Securely paste or upload your chat file.</p>
                </div>
                 <div className="bg-white/50 p-4 rounded-2xl shadow-lg backdrop-blur-sm border border-rose-100">
                    <BrainCircuitIcon className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-rose-800">2. Analyze</h3>
                    <p className="text-sm text-rose-700/90">Our AI diagnoses patterns and dynamics.</p>
                </div>
                 <div className="bg-white/50 p-4 rounded-2xl shadow-lg backdrop-blur-sm border border-rose-100">
                    <FileTextIcon className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-rose-800">3. Report</h3>
                    <p className="text-sm text-rose-700/90">Receive your visual, in-depth report.</p>
                </div>
            </div>
        </div>
    );
};

export default UploadScreen;