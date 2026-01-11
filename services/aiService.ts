
import { GoogleGenAI, Type } from "@google/genai";
import { StudentProfile, ProfessionalProfile, ChatRequest } from "../types.ts";

/**
 * Robust wrapper to handle Gemini API rate limits (429) with jittered exponential backoff.
 * This is crucial for production stability.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error: any) {
      const errorStr = JSON.stringify(error);
      const isRateLimit = 
        error?.message?.includes("429") || 
        error?.status === 429 || 
        errorStr.includes("429") || 
        errorStr.includes("RESOURCE_EXHAUSTED");
      
      if (isRateLimit && attempt < retries) {
        attempt++;
        // Jittered exponential backoff: (2^attempt * 2000ms) + random(0, 1000ms)
        const delay = (Math.pow(2, attempt) * 2000) + (Math.random() * 1000); 
        console.warn(`Gemini 429 (Quota) encountered. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Maximum retry attempts reached for Gemini API. Switch to a paid API key or use the Flash model.");
}

export const aiService = {
  // Using 'gemini-3-flash-preview' for high-frequency tasks to avoid 429 errors
  async coachDraftMessage(student, professional, goal) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `AI Mentorship Coach. Help this student reach out to a professional. 
      Student: ${JSON.stringify(student)}
      Professional: ${JSON.stringify(professional)}
      Goal: ${goal}
      Output JSON with: messageDraft (<=120 words), talkingPoints (6), suggestedQuestions (6).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              messageDraft: { type: Type.STRING },
              talkingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  },

  async getRecommendations(student, professionals) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `AI Matcher. Find TOP 5 matches.
      Student: ${JSON.stringify(student)}
      Mentors: ${JSON.stringify(professionals.slice(0, 15))}
      Return JSON array of: professionalId, score (0-100), rationale.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                professionalId: { type: Type.STRING },
                score: { type: Type.NUMBER },
                rationale: { type: Type.STRING }
              }
            }
          }
        }
      });
      return JSON.parse(response.text || '[]');
    });
  },

  async generateCareerStrategy(profile: any, aspirations: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `AI Career Architect. Roadmap for: ${aspirations}. 
      Profile: ${JSON.stringify(profile)}. Output JSON with mentorshipFocus and roadmap (phase1, phase2, phase3).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mentorshipFocus: { type: Type.STRING },
              roadmap: { type: Type.OBJECT, properties: {
                phase1ShortTerm: { type: Type.OBJECT, properties: { title: {type: Type.STRING}, tasks: {type: Type.ARRAY, items: {type: Type.STRING}} } },
                phase2MidTerm: { type: Type.OBJECT, properties: { title: {type: Type.STRING}, tasks: {type: Type.ARRAY, items: {type: Type.STRING}} } },
                phase3LongTerm: { type: Type.OBJECT, properties: { title: {type: Type.STRING}, tasks: {type: Type.ARRAY, items: {type: Type.STRING}} } }
              }}
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  },

  async getJobsAndCoops(student: StudentProfile) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `AI Jobs. Based on: ${JSON.stringify(student)}. Find 5 jobs. Output JSON array.`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                company: { type: Type.STRING },
                matchScore: { type: Type.NUMBER },
                sourceUrl: { type: Type.STRING }
              }
            }
          }
        }
      });
      return JSON.parse(response.text || '[]');
    });
  },

  async getEvents(student: StudentProfile) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `AI Events. Based on: ${JSON.stringify(student)}. Find 5 events. Output JSON array.`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                organizer: { type: Type.STRING },
                sourceUrl: { type: Type.STRING }
              }
            }
          }
        }
      });
      return JSON.parse(response.text || '[]');
    });
  },

  async generateMeetingPrep(student: StudentProfile, professional: ProfessionalProfile, requestDetails: ChatRequest) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `AI Meeting Prep.
      Student: ${JSON.stringify(student)}
      Professional: ${JSON.stringify(professional)}
      Goal: ${requestDetails.studentNote}
      Create a 30-min agenda, 3 impactful questions, and 3 preparation tips.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              agenda: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { time: {type: Type.STRING}, topic: {type: Type.STRING} } 
                } 
              },
              questions: { type: Type.ARRAY, items: { type: Type.STRING } },
              tips: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  },

  async generatePostCallFollowUp(student: StudentProfile | undefined, professional: ProfessionalProfile | undefined, discussionSummary: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `AI Mentorship Coach. Draft a polite and professional follow-up message from a student to a mentor.
      Student Info: ${JSON.stringify(student)}
      Mentor Info: ${JSON.stringify(professional)}
      Discussion Summary: ${discussionSummary}
      Output JSON with: followUpDraft (string, max 100 words).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              followUpDraft: { type: Type.STRING }
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  }
};
