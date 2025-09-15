import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisReport } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const getSystemPrompt = (mode: 'quick' | 'deep', anonymize: boolean) => `You are a world-class Relationship Analyzer performing a **${mode} analysis**. Your tone is empathetic, precise, and like a clinical yet nonjudgmental observer. You will analyze the provided chat transcript and output a structured diagnostic report in JSON format. You MUST adhere to the provided JSON schema.

${anonymize ? 'You MUST anonymize the names of the individuals, referring to them consistently as "Person A" and "Person B".' : 'You should infer the names of the two individuals and use them consistently.'}

=== CORE ANALYSIS PARAMETERS ===
${mode === 'quick' ? 
`**Quick Mode:** Focus on high-level metrics.
1) General Stats: Total messages, reciprocity ratio.
2) Metrics & Meters: Calculate percentages for: Working Probability, Trust, Love, Compatibility.
3) Flags: Identify up to 2 of each Green, Yellow, and Red flags.
4) TLDR & Verdict: Provide a concise summary and verdict.
` : 
`**Deep Mode:** Perform a comprehensive analysis of all parameters.
1) General Stats:
- Total messages, initiations, reciprocity ratio, response speed distribution.
- Message volume (per day/month, time-of-day, % night texting).
- Token Counts: Affection, Support, Apology, Threat (block/breakup).
- Emoji frequency (per person, per 100 msgs).
- Pronoun counts ("I", "you", "we").
- Message size (avg, median, by person).

2) Timeline / Phases:
- Chronological analysis by month/week.
- Tag phases (e.g., dating, honeymoon, conflict loops, repair).
- Create tables with counts for Ex mentions, Past mentions, Cheat mentions, Trust mentions, Jealousy mentions, Breakup, Block — both raw numbers and ratios.
- Calculate Affection-to-Conflict ratio per phase.

3) Personality & Psychology:
- Assign OCEAN personality framework scores (0–100) for each person with supporting evidence quotes.
- Analyze subtle psychology: hedging language, avoidance, Freudian slips, anticipatory phrases.
- Proportions of Direct vs Indirect vs Neutral messaging.
- Role flavor (e.g., one probing/softening vs other decisive/brief).
- Self-labeling behavior (e.g., "I'm just jealous").
- Boundary clarity (e.g., anti-nudes stance, sex-positive framing, privacy ethics).
- Value-based ethics (e.g., break before cheat vs overlap).

4) Conflict & Repair:
- Analyze repair attempts (apology frequency, reconciliation moves).
- Identify who escalates vs who de-escalates.
- Analyze threat language (block/breakup counts, trend over months).
- Identify looping unresolved topics (e.g., ex, jealousy, trust).
- Assess repair asymmetry (who contributes more to repairs).

5) Metrics & Meters:
- Calculate percentages for: Working Probability, Trust, Love, Long-term, Compatibility, “Wife” meter.
- Analyze Affection vs Support balance over time.
- Assess Sleep/focus risk factor from late-night texting.
- Calculate a Reciprocity health index (initiation & reply speed balance).
- Assess Dopamine/volume addiction risk (avg msgs/day).
- Track Affection-to-Conflict ratio monthly trend.

6) Relationship Timeline Visualization:
- Identify and extract key timeline events. Categorize them as 'Positive' (e.g., affection, support, gifts, "I love you"), 'Negative' (e.g., arguments, threats, blocking), 'Neutral' (e.g., mood swings, delays), or 'Stop' (e.g., significant breaks in communication). For each event, provide the date, a description, your inference, and a short evidence quote.
- Segment the entire chat history into distinct phases (e.g., 'Early Talking', 'Dating', 'Commitment', 'Strain', 'Repair'). For each phase, provide a start and end date. Ensure phases are chronological and cover the whole timeline.
`}
=== RULES ===
- Every metric MUST include a numeric value, an insight into why it matters, and 1-3 direct evidence quotes (<=25 words each).
- For deep analysis, monthly timeline tables with topic mention ratios are mandatory.
- Use emojis in reports where appropriate (❤️ 🔒 😔 🚩 ✅).
- If abuse signs are detected, display an urgent warning with resources.
- For visualizations, provide raw numbers for time of day distribution, reciprocity, and the new timeline data.
- The timeline must be in chronological order. Infer approximate dates if they are not explicit.

OUTPUT FORMAT: A single, valid JSON object that strictly follows the provided schema. Do not include any markdown formatting like \`\`\`json.`;


const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        tldr: { type: Type.STRING, description: 'A 2-3 line summary of the entire analysis.' },
        verdict: {
            type: Type.OBJECT, properties: { text: { type: Type.STRING }, confidence: { type: Type.INTEGER } }, required: ['text', 'confidence']
        },
        generalMetrics: {
            type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                    name: { type: Type.STRING }, value: { type: Type.STRING },
                    insight: { type: Type.STRING }, evidence: { type: Type.ARRAY, items: { type: Type.STRING } }
                }, required: ['name', 'value', 'insight', 'evidence']
            }
        },
        timeline: {
            type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                    period: { type: Type.STRING }, phase: { type: Type.STRING }, phaseDescription: { type: Type.STRING },
                    affectionToConflictRatio: { type: Type.STRING },
                    topicMentions: {
                        type: Type.OBJECT, properties: {
                            ex: { type: Type.INTEGER }, past: { type: Type.INTEGER }, cheat: { type: Type.INTEGER },
                            trust: { type: Type.INTEGER }, jealousy: { type: Type.INTEGER }, breakup: { type: Type.INTEGER },
                            block: { type: Type.INTEGER }
                        }, required: ['ex', 'past', 'cheat', 'trust', 'jealousy', 'breakup', 'block']
                    }
                }, required: ['period', 'phase', 'phaseDescription', 'affectionToConflictRatio', 'topicMentions']
            }
        },
        personAAnalysis: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'The name of the person, or "Person A" / "Person B" if anonymized.' },
                oceanScore: {
                    type: Type.OBJECT,
                    properties: {
                        openness: { type: Type.INTEGER }, conscientiousness: { type: Type.INTEGER },
                        extraversion: { type: Type.INTEGER }, agreeableness: { type: Type.INTEGER },
                        neuroticism: { type: Type.INTEGER }
                    },
                     required: ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']
                },
                oceanEvidence: {
                    type: Type.OBJECT,
                    properties: {
                        openness: { type: Type.STRING }, conscientiousness: { type: Type.STRING },
                        extraversion: { type: Type.STRING }, agreeableness: { type: Type.STRING },
                        neuroticism: { type: Type.STRING }
                    },
                    required: ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']
                },
                messagingStyle: {
                    type: Type.OBJECT,
                    properties: {
                        directness: { type: Type.STRING }, roleFlavor: { type: Type.STRING },
                        selfLabeling: { type: Type.STRING }, boundaryClarity: { type: Type.STRING },
                        valueEthics: { type: Type.STRING }
                    },
                    required: ['directness', 'roleFlavor', 'selfLabeling', 'boundaryClarity', 'valueEthics']
                }
            },
            required: ['name', 'oceanScore', 'oceanEvidence', 'messagingStyle']
        },
        personBAnalysis: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'The name of the person, or "Person A" / "Person B" if anonymized.' },
                oceanScore: {
                    type: Type.OBJECT,
                    properties: {
                        openness: { type: Type.INTEGER }, conscientiousness: { type: Type.INTEGER },
                        extraversion: { type: Type.INTEGER }, agreeableness: { type: Type.INTEGER },
                        neuroticism: { type: Type.INTEGER }
                    },
                     required: ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']
                },
                oceanEvidence: {
                    type: Type.OBJECT,
                    properties: {
                        openness: { type: Type.STRING }, conscientiousness: { type: Type.STRING },
                        extraversion: { type: Type.STRING }, agreeableness: { type: Type.STRING },
                        neuroticism: { type: Type.STRING }
                    },
                    required: ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']
                },
                messagingStyle: {
                    type: Type.OBJECT,
                    properties: {
                        directness: { type: Type.STRING }, roleFlavor: { type: Type.STRING },
                        selfLabeling: { type: Type.STRING }, boundaryClarity: { type: Type.STRING },
                        valueEthics: { type: Type.STRING }
                    },
                    required: ['directness', 'roleFlavor', 'selfLabeling', 'boundaryClarity', 'valueEthics']
                }
            },
            required: ['name', 'oceanScore', 'oceanEvidence', 'messagingStyle']
        },
        soloPatterns: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    evidence: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['title', 'description', 'evidence']
            }
        },
        coupleDynamics: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    evidence: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['title', 'description', 'evidence']
            }
        },
        flags: {
            type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                    type: { type: Type.STRING, description: "The type of the flag. Must be one of 'Green', 'Yellow', or 'Red'." },
                    description: { type: Type.STRING }, evidence: { type: Type.ARRAY, items: { type: Type.STRING } }
                }, required: ['type', 'description', 'evidence']
            }
        },
        fixingKit: {
            type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: { category: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.STRING } }
                }, required: ['category', 'items']
            }
        },
        discussionTopics: {
            type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                    topic: { type: Type.STRING }, when: { type: Type.STRING, description: "When to discuss this topic. Must be one of 'Now' or 'Later'." }, reason: { type: Type.STRING }
                }, required: ['topic', 'when', 'reason']
            }
        },
        giftAndDateIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
        finalSnapshot: {
            type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                    name: { type: Type.STRING }, value: { type: Type.INTEGER }, emoji: { type: Type.STRING }
                }, required: ['name', 'value', 'emoji']
            }
        },
        safetyWarning: {
            type: Type.OBJECT, properties: {
                isTriggered: { type: Type.BOOLEAN }, details: { type: Type.STRING },
                resources: {
                    type: Type.ARRAY, items: {
                        type: Type.OBJECT, properties: { name: { type: Type.STRING }, contact: { type: Type.STRING } }, required: ['name', 'contact']
                    }
                }
            }, required: ['isTriggered', 'details', 'resources']
        },
        analysisMode: { type: Type.STRING, description: "The mode of analysis performed. Must be one of 'quick' or 'deep'." },
        privacy: { type: Type.OBJECT, properties: { anonymize: { type: Type.BOOLEAN } }, required: ['anonymize'] },
        visualizations: {
            type: Type.OBJECT,
            properties: {
                timeOfDay: {
                    type: Type.OBJECT, properties: {
                        morning: { type: Type.INTEGER }, afternoon: { type: Type.INTEGER },
                        evening: { type: Type.INTEGER }, night: { type: Type.INTEGER }
                    }, required: ['morning', 'afternoon', 'evening', 'night']
                },
                reciprocity: {
                    type: Type.OBJECT, properties: {
                        personAInitiations: { type: Type.INTEGER }, personBInitiations: { type: Type.INTEGER },
                        personAResponseSpeedMinutes: { type: Type.INTEGER }, personBResponseSpeedMinutes: { type: Type.INTEGER }
                    }, required: ['personAInitiations', 'personBInitiations', 'personAResponseSpeedMinutes', 'personBResponseSpeedMinutes']
                },
                visualTimelineEvents: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            date: { type: Type.STRING },
                            type: { type: Type.STRING, description: "Must be 'Positive', 'Negative', 'Neutral', or 'Stop'" },
                            description: { type: Type.STRING },
                            inference: { type: Type.STRING },
                            evidence: { type: Type.STRING }
                        },
                        required: ['date', 'type', 'description', 'inference', 'evidence']
                    }
                },
                visualTimelinePhases: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            startDate: { type: Type.STRING },
                            endDate: { type: Type.STRING }
                        },
                        required: ['name', 'startDate', 'endDate']
                    }
                }
            },
            required: ['timeOfDay', 'reciprocity', 'visualTimelineEvents', 'visualTimelinePhases']
        }
    },
    required: ['tldr', 'verdict', 'generalMetrics', 'timeline', 'personAAnalysis', 'personBAnalysis', 'soloPatterns', 'coupleDynamics', 'flags', 'fixingKit', 'discussionTopics', 'giftAndDateIdeas', 'finalSnapshot', 'safetyWarning', 'analysisMode', 'privacy', 'visualizations']
};

export const analyzeChatTranscript = async (transcript: string, mode: 'quick' | 'deep', anonymize: boolean): Promise<Omit<AnalysisReport, 'meta'>> => {
    try {
        // Truncate very long transcripts to avoid hitting token limits
        const MAX_CHARS = 3000000; // Approx 750k tokens, leaving buffer for prompt and response
        if (transcript.length > MAX_CHARS) {
            transcript = transcript.slice(transcript.length - MAX_CHARS);
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
                parts: [
                    { text: getSystemPrompt(mode, anonymize) },
                    { text: `Here is the chat transcript to analyze:\n\n---\n\n${transcript}` }
                ]
            }],
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        // The model will return these, so we ensure they are correctly typed
        const finalResult = {
          ...result,
          analysisMode: mode,
          privacy: { anonymize }
        };
        return finalResult as Omit<AnalysisReport, 'meta'>;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            const errorMessage = error.message.includes('JSON') 
                ? `The AI returned an invalid analysis format. This can happen with very complex conversations. Please try a different chat excerpt. Error: ${error.message}`
                : `Failed to analyze transcript: ${error.message}`;
            throw new Error(errorMessage);
        }
        throw new Error("An unknown error occurred during analysis.");
    }
};