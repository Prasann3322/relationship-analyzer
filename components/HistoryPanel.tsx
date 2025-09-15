import React from 'react';
import type { AnalysisReport } from '../types';
import { HistoryIcon, MessageSquareTextIcon, ArrowRightIcon } from './icons/Icons';

interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    history: AnalysisReport[];
    onViewHistory: (report: AnalysisReport) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, history, onViewHistory }) => {
    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <div 
                className={`fixed top-0 left-0 h-full w-full max-w-sm bg-rose-50/95 backdrop-blur-lg shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="history-panel-title"
            >
                <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 id="history-panel-title" className="text-2xl font-bold text-rose-800 font-serif flex items-center gap-2">
                            <HistoryIcon className="h-6 w-6" />
                            Analysis History
                        </h2>
                        <button onClick={onClose} className="p-1 text-rose-500 hover:text-rose-700" aria-label="Close history panel">
                            <ArrowRightIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {history.length > 0 ? (
                        <div className="space-y-3 overflow-y-auto flex-grow pr-2">
                            {history.map(item => (
                                <button 
                                    key={item.meta.id} 
                                    onClick={() => onViewHistory(item)} 
                                    className="w-full text-left p-4 rounded-lg bg-white/60 hover:bg-rose-100 border border-rose-200 transition-all duration-200 shadow-sm group"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-rose-800">{new Date(item.meta.analysisDate).toLocaleString()}</p>
                                            <p className="text-sm text-rose-600 font-medium">Mode: {item.analysisMode}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-rose-400 group-hover:text-rose-600 transition-colors">
                                             <span className="text-sm">View</span>
                                             <ArrowRightIcon className="h-4 w-4 transform -rotate-45 group-hover:rotate-0 transition-transform" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-rose-700/90 mt-2 italic truncate">"{item.tldr}"</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center flex-grow flex flex-col items-center justify-center text-rose-500">
                            <MessageSquareTextIcon className="h-12 w-12 mb-4" />
                            <p className="font-semibold">No history yet!</p>
                            <p className="text-sm">Your past analyses will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default HistoryPanel;