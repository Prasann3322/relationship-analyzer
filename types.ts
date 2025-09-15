export enum AppState {
    UPLOAD = 'UPLOAD',
    ANALYZING = 'ANALYZING',
    REPORT = 'REPORT'
}

export interface ReportMeta {
    id: string;
    analysisDate: string;
    fileName: string;
    firstMessageDate: string;
    lastMessageDate: string;
}

export interface Verdict {
    text: string;
    confidence: number;
}

export interface GeneralMetric {
    name: string;
    value: string;
    insight: string;
    evidence: string[];
}

export interface TimelineEntry {
    period: string;
    phase: string;
    phaseDescription: string;
    affectionToConflictRatio: string;
    topicMentions: {
        ex: number;
        past: number;
        cheat: number;
        trust: number;
        jealousy: number;
        breakup: number;
        block: number;
    };
}

export interface PersonAnalysis {
    name: string;
    oceanScore: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
    };
    oceanEvidence: {
        openness: string;
        conscientiousness: string;
        extraversion: string;
        agreeableness: string;
        neuroticism: string;
    };
    messagingStyle: {
        directness: string;
        roleFlavor: string;
        selfLabeling: string;
        boundaryClarity: string;
        valueEthics: string;
    };
}

export interface DynamicPattern {
    title: string;
    description: string;
    evidence: string[];
}

export interface Flag {
    type: 'Green' | 'Yellow' | 'Red';
    description: string;
    evidence: string[];
}

export interface FixingKitItem {
    category: string;
    items: string[];
}

export interface DiscussionTopic {
    topic: string;
    when: 'Now' | 'Later';
    reason: string;
}

export interface FinalSnapshotMeter {
    name: string;
    value: number;
    emoji: string;
}

export interface SafetyWarning {
    isTriggered: boolean;
    details: string;
    resources: { name: string; contact: string; }[];
}

export interface TimeOfDayDistribution {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
}

export interface ReciprocityData {
    personAInitiations: number;
    personBInitiations: number;
    personAResponseSpeedMinutes: number;
    personBResponseSpeedMinutes: number;
}

// NEW: Types for the visual relationship timeline
export interface TimelineEvent {
    date: string; // "YYYY-MM-DD"
    type: 'Positive' | 'Negative' | 'Neutral' | 'Stop';
    description: string;
    inference: string;
    evidence: string;
}

export interface TimelinePhase {
    name: string; // "Dating", "Commitment", "Strain", etc.
    startDate: string; // "YYYY-MM-DD"
    endDate: string; // "YYYY-MM-DD"
}


export interface AnalysisReport {
    meta: ReportMeta;
    tldr: string;
    verdict: Verdict;
    generalMetrics: GeneralMetric[];
    timeline: TimelineEntry[];
    personAAnalysis: PersonAnalysis;
    personBAnalysis: PersonAnalysis;
    soloPatterns: DynamicPattern[];
    coupleDynamics: DynamicPattern[];
    flags: Flag[];
    fixingKit: FixingKitItem[];
    discussionTopics: DiscussionTopic[];
    giftAndDateIdeas: string[];
    finalSnapshot: FinalSnapshotMeter[];
    safetyWarning: SafetyWarning;
    analysisMode: 'quick' | 'deep';
    privacy: {
        anonymize: boolean;
    };
    visualizations: {
        timeOfDay: TimeOfDayDistribution;
        reciprocity: ReciprocityData;
        // NEW: Added fields for timeline visualization data
        visualTimelineEvents: TimelineEvent[];
        visualTimelinePhases: TimelinePhase[];
    };
}