import React, { useState, useMemo } from 'react';
import type { AnalysisReport, PersonAnalysis, TimelineEvent, TimelinePhase, FinalSnapshotMeter } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { ArrowLeftIcon, ChevronDownIcon, ChevronUpIcon, DownloadIcon, MessageCircleHeartIcon, ShieldAlertIcon, SparklesIcon, SyringeIcon, TrophyIcon, UserCheckIcon, UsersIcon, ScaleIcon, TimelineIcon, CircleCheckIcon, CircleAlertIcon, CircleXIcon, PauseIcon, HeartPulseIcon } from './icons/Icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportScreenProps {
    report: AnalysisReport;
    onBack: () => void;
}

const ExpandableSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-white/60 p-4 sm:p-6 rounded-2xl shadow-lg border border-rose-100 backdrop-blur-sm transition-all duration-300">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
                <div className="flex items-center gap-3">
                    {icon}
                    <h2 className="text-xl sm:text-2xl font-bold text-rose-800 font-serif">{title}</h2>
                </div>
                {isOpen ? <ChevronUpIcon className="h-6 w-6 text-rose-500" /> : <ChevronDownIcon className="h-6 w-6 text-rose-500" />}
            </button>
            {isOpen && <div className="mt-4 animate-fade-in-up space-y-4">{children}</div>}
        </div>
    );
};

const MetricMeter: React.FC<{ meter: FinalSnapshotMeter }> = ({ meter }) => (
    <div className="flex flex-col items-center text-center">
        <div className="text-4xl font-bold text-rose-600">{meter.value}<span className="text-2xl">%</span></div>
        <p className="mt-1 font-semibold text-rose-700 text-sm">{meter.name} {meter.emoji}</p>
    </div>
);

const OCEANRadarChart: React.FC<{ personA: PersonAnalysis, personB: PersonAnalysis }> = ({ personA, personB }) => {
    const data = Object.keys(personA.oceanScore).map(key => ({
        subject: key.charAt(0).toUpperCase() + key.slice(1),
        A: personA.oceanScore[key as keyof typeof personA.oceanScore],
        B: personB.oceanScore[key as keyof typeof personB.oceanScore],
        fullMark: 100,
    }));
    return (
        <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                <PolarGrid stroke="#fbcfe8" />
                <PolarAngleAxis dataKey="subject" stroke="#be185d" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', border: '1px solid #fecdd3', borderRadius: '0.5rem' }}/>
                <Legend wrapperStyle={{fontSize: '14px'}} />
                <Radar name={personA.name} dataKey="A" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.6} />
                <Radar name={personB.name} dataKey="B" stroke="#4a044e" fill="#4a044e" fillOpacity={0.5} />
            </RadarChart>
        </ResponsiveContainer>
    );
};

const TimeOfDayPieChart: React.FC<{ data: AnalysisReport['visualizations']['timeOfDay'] }> = ({ data }) => {
    const chartData = Object.entries(data).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
    const COLORS = ['#fbbf24', '#f97316', '#8b5cf6', '#3b0764'];
    return(
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                     {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', border: '1px solid #fecdd3', borderRadius: '0.5rem' }}/>
                <Legend wrapperStyle={{fontSize: '14px'}} />
            </PieChart>
        </ResponsiveContainer>
    );
};

const RelationshipTimeline: React.FC<{ events: TimelineEvent[], phases: TimelinePhase[] }> = ({ events, phases }) => {
    const [activeEventId, setActiveEventId] = useState<string | null>(null);

    const timelineItems = useMemo(() => {
        // FIX: The `date` property does not exist on TimelinePhase, causing a TypeScript error during sort.
        // The fix is to not add a temporary `date` property to phase items. Instead, a type guard inside
        // the sort function is used to access the correct date property ('date' for events, 'startDate' for phases).
        const items: ( (TimelineEvent & { itemType: 'event' }) | (TimelinePhase & { itemType: 'phase' }) )[] = [
            ...events.map(e => ({ ...e, itemType: 'event' as const })),
            ...phases.map(p => ({ ...p, itemType: 'phase' as const }))
        ];
        
        return items.sort((a, b) => {
            const aDate = a.itemType === 'event' ? a.date : a.startDate;
            const bDate = b.itemType === 'event' ? b.date : b.startDate;
            return new Date(aDate).getTime() - new Date(bDate).getTime();
        });
    }, [events, phases]);

    if (timelineItems.length === 0) return <p className="text-rose-600">Not enough data to generate a timeline.</p>;

    const eventIcons: { [key: string]: React.ReactNode } = {
        'Positive': <CircleCheckIcon className="w-5 h-5 text-green-600" />,
        'Negative': <CircleXIcon className="w-5 h-5 text-red-600" />,
        'Neutral': <CircleAlertIcon className="w-5 h-5 text-yellow-600" />,
        'Stop': <PauseIcon className="w-5 h-5 text-gray-600" />
    };

    const phaseColors: { [key: string]: string } = {
        'default': 'border-rose-300 bg-rose-100 text-rose-700',
        'dating': 'border-pink-300 bg-pink-100 text-pink-700',
        'commitment': 'border-red-300 bg-red-100 text-red-700',
        'strain': 'border-yellow-300 bg-yellow-100 text-yellow-700',
        'repair': 'border-green-300 bg-green-100 text-green-700',
        'conflict': 'border-orange-300 bg-orange-100 text-orange-700'
    };
    
    return (
        <div className="relative pl-5">
            {/* The vertical "lifeline" */}
            <div className="absolute left-5 top-0 h-full w-0.5 bg-rose-200" aria-hidden="true"></div>

            <div className="space-y-10">
                {timelineItems.map((item, index) => {
                    const id = `${item.itemType}-${index}`;
                    if (item.itemType === 'phase') {
                         const colorKey = item.name.toLowerCase().split(' ')[0];
                         const color = phaseColors[colorKey] || phaseColors.default;
                        return (
                             <div key={id} className="relative pl-10">
                                <div className={`absolute -left-1 top-1.5 w-6 h-6 rounded-full ${color.split(' ')[1]} border-4 border-rose-50`}></div>
                                <div className={`p-2 rounded-lg border-l-4 ${color.split(' ')[0]} ${color.split(' ')[1]}`}>
                                    <p className={`font-bold text-md ${color.split(' ')[2]}`}>Phase Change: {item.name}</p>
                                    <p className="text-xs">{new Date(item.startDate).toLocaleDateString()} to {new Date(item.endDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )
                    }

                    // Event Item
                    const event = item;
                    return (
                        <div key={id} className="relative pl-10">
                            {/* Icon Node */}
                             <div className="absolute -left-1 top-1.5 w-6 h-6 rounded-full bg-white flex items-center justify-center border-2 border-rose-200">
                                {eventIcons[event.type] || <CircleAlertIcon className="w-5 h-5 text-gray-500"/>}
                            </div>
                            
                            {/* Content Card */}
                            <div className="bg-white/70 p-4 rounded-xl border border-rose-100 shadow-sm cursor-pointer" onClick={() => setActiveEventId(activeEventId === id ? null : id)}>
                                <p className="text-xs text-rose-500">{new Date(event.date).toLocaleDateString()}</p>
                                <p className="font-semibold text-rose-800">{event.description}</p>
                                {activeEventId === id && (
                                    <div className="mt-2 pt-2 border-t border-rose-200/50 animate-fade-in-up text-sm">
                                        <p className="text-rose-600"><strong className="font-semibold">Inference:</strong> {event.inference}</p>
                                        <p className="text-rose-500 italic mt-2">"{event.evidence}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ReportScreen: React.FC<ReportScreenProps> = ({ report, onBack }) => {
    const reportRef = React.useRef<HTMLDivElement>(null);

    const handleDownloadPdf = () => {
        const input = reportRef.current;
        if (input) {
            html2canvas(input, { scale: 2, backgroundColor: null, useCORS: true, windowWidth: 1280 }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const canvasHeight = canvas.height;
                const canvasWidth = canvas.width;
                const ratio = pdfWidth / canvasWidth;
                const pdfHeight = canvasHeight * ratio;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`RelationScope_Report_${report.meta.id}.pdf`);
            });
        }
    };
    
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="flex items-center gap-2 text-rose-600 hover:text-rose-800 font-semibold transition-colors">
                    <ArrowLeftIcon className="h-5 w-5" />
                    <span>New Analysis</span>
                </button>
                <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white font-semibold rounded-lg shadow-md hover:bg-rose-600 transition-colors">
                    <DownloadIcon className="h-5 w-5" />
                    <span>Download PDF</span>
                </button>
            </div>

            <div ref={reportRef} className="p-4 sm:p-8 bg-rose-100/30 rounded-3xl space-y-6">
                <div className="text-center p-6 border-b-2 border-dashed border-rose-300">
                    <h1 className="text-4xl font-bold text-rose-800 font-serif">Relationship Diagnostic Report</h1>
                    <p className="text-rose-600 mt-1">Mode: <span className="font-semibold">{report.analysisMode.charAt(0).toUpperCase() + report.analysisMode.slice(1)}</span> | Analyzed on {new Date(report.meta.analysisDate).toLocaleString()}</p>
                </div>

                {report.safetyWarning.isTriggered && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg" role="alert">
                        <p className="font-bold flex items-center gap-2"><ShieldAlertIcon/> Safety Warning</p>
                        <p>{report.safetyWarning.details}</p>
                    </div>
                )}
                
                <div className="p-6 bg-rose-200/50 rounded-2xl text-center">
                    <p className="text-lg text-rose-700 italic mb-4">"{report.tldr}"</p>
                    <div className="bg-rose-800 text-white py-3 px-6 rounded-xl inline-block">
                        <p className="font-bold text-xl">Verdict: {report.verdict.text} <span className="opacity-75">({report.verdict.confidence}% Confidence)</span></p>
                    </div>
                </div>

                 <ExpandableSection title="Final Snapshot" icon={<TrophyIcon className="h-7 w-7 text-rose-500"/>} defaultOpen={true}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 justify-items-center">
                        {report.finalSnapshot.map(meter => <MetricMeter key={meter.name} meter={meter} />)}
                    </div>
                </ExpandableSection>

                {report.analysisMode === 'deep' && (
                    <>
                        <ExpandableSection title="Personality Analysis (OCEAN)" icon={<UserCheckIcon className="h-7 w-7 text-rose-500"/>} defaultOpen={true}>
                            <OCEANRadarChart personA={report.personAAnalysis} personB={report.personBAnalysis} />
                             <div className="grid md:grid-cols-2 gap-4 text-sm mt-4">
                                <div>
                                    <h4 className="font-bold text-rose-800 mb-1">{report.personAAnalysis.name}'s Style:</h4>
                                    <p><strong className="text-rose-600">Role:</strong> {report.personAAnalysis.messagingStyle.roleFlavor}</p>
                                    <p><strong className="text-rose-600">Values:</strong> {report.personAAnalysis.messagingStyle.valueEthics}</p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-rose-800 mb-1">{report.personBAnalysis.name}'s Style:</h4>
                                    <p><strong className="text-rose-600">Role:</strong> {report.personBAnalysis.messagingStyle.roleFlavor}</p>
                                    <p><strong className="text-rose-600">Values:</strong> {report.personBAnalysis.messagingStyle.valueEthics}</p>
                                </div>
                            </div>
                        </ExpandableSection>

                        <ExpandableSection title="Communication Patterns" icon={<ScaleIcon className="h-7 w-7 text-rose-500"/>} defaultOpen={true}>
                           <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                     <h3 className="font-semibold text-rose-800 text-center mb-2">Time Of Day Distribution</h3>
                                    <TimeOfDayPieChart data={report.visualizations.timeOfDay} />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-rose-800 text-center mb-2">Reciprocity</h3>
                                    <div className="text-center">
                                         <p className="font-semibold text-rose-700">Initiations</p>
                                         <p className="text-rose-600">{report.personAAnalysis.name}: {report.visualizations.reciprocity.personAInitiations} vs {report.personBAnalysis.name}: {report.visualizations.reciprocity.personBInitiations}</p>
                                    </div>
                                     <div className="text-center">
                                         <p className="font-semibold text-rose-700">Avg. Response Speed</p>
                                         <p className="text-rose-600">{report.personAAnalysis.name}: {report.visualizations.reciprocity.personAResponseSpeedMinutes}m vs {report.personBAnalysis.name}: {report.visualizations.reciprocity.personBResponseSpeedMinutes}m</p>
                                    </div>
                                    <div className="mt-4">
                                        {report.generalMetrics.slice(0, 2).map(metric => (
                                            <div key={metric.name} className="bg-rose-50/50 p-3 rounded-lg border border-rose-200 mb-2">
                                                <p className="font-semibold text-rose-700 text-sm">{metric.name}: <span className="font-bold text-rose-900">{metric.value}</span></p>
                                                <p className="text-xs text-rose-600 mt-1">{metric.insight}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                           </div>
                        </ExpandableSection>
                    </>
                )}
                
                <ExpandableSection title="Flags & Observations" icon={<ShieldAlertIcon className="h-7 w-7 text-rose-500"/>}>
                    {(['Green', 'Yellow', 'Red'] as const).map(flagType => (
                         <div key={flagType} className="mb-4">
                            <h3 className={`text-xl font-semibold ${flagType === 'Green' ? 'text-green-600' : flagType === 'Yellow' ? 'text-yellow-600' : 'text-red-600'}`}>
                                {flagType} Flags {flagType === 'Green' ? '✅' : flagType === 'Yellow' ? '🟡' : '🚩'}
                            </h3>
                            <ul className="list-disc list-inside space-y-2 mt-2">
                                {report.flags.filter(f => f.type === flagType).map((flag, i) => (
                                    <li key={i} className="text-rose-700">
                                        {flag.description}
                                        <p className="text-sm text-rose-500 italic ml-4">"{flag.evidence[0]}"</p>
                                    </li>
                                ))}
                                {report.flags.filter(f => f.type === flagType).length === 0 && <p className="text-sm text-rose-500">No {flagType} flags identified.</p>}
                            </ul>
                        </div>
                    ))}
                </ExpandableSection>
                 {report.analysisMode === 'deep' && (
                    <>
                        <ExpandableSection title="Fixing Kit & Scripts" icon={<SyringeIcon className="h-7 w-7 text-rose-500"/>}>
                            <div className="grid md:grid-cols-2 gap-6">
                                {report.fixingKit.map(kit => (
                                    <div key={kit.category} className="bg-rose-50/50 p-4 rounded-lg border border-rose-200">
                                        <h4 className="font-bold text-rose-800 mb-2">{kit.category}</h4>
                                        <ul className="list-disc list-inside space-y-1 text-rose-700">
                                            {kit.items.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </ExpandableSection>

                        {report.visualizations?.visualTimelineEvents?.length > 0 && (
                            <ExpandableSection title="Relationship Timeline" icon={<TimelineIcon className="h-7 w-7 text-rose-500"/>} defaultOpen={true}>
                                <RelationshipTimeline events={report.visualizations.visualTimelineEvents} phases={report.visualizations.visualTimelinePhases} />
                            </ExpandableSection>
                        )}

                         <ExpandableSection title="Gift & Date Ideas" icon={<SparklesIcon className="h-7 w-7 text-rose-500"/>}>
                             <ul className="list-disc list-inside space-y-1 text-rose-700">
                                {report.giftAndDateIdeas.map((idea, i) => <li key={i}>{idea}</li>)}
                            </ul>
                        </ExpandableSection>
                    </>
                 )}
            </div>
             <button onClick={handleDownloadPdf} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 text-white font-semibold rounded-lg shadow-lg hover:bg-rose-700 transition-colors transform hover:scale-[1.02]">
                <DownloadIcon className="h-6 w-6" />
                <span>Download Full Report as PDF</span>
            </button>
        </div>
    );
};

export default ReportScreen;