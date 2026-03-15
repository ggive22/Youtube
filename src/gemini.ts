import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ScriptSection {
  script: string;
  engagementScore: number;
  feedback: string;
}

export interface BodySection extends ScriptSection {
  loopsUsed: string[];
  rehooksUsed: string[];
  unexpectedConnection: string;
}

export interface ScriptResponse {
  title: string;
  intro: ScriptSection;
  body: BodySection;
  outro: ScriptSection & { antiAbandonmentRule: string };
  shockScoreAudit: {
    score: number;
    reasoning: string;
  };
}

export async function generateYouTubeScript(params: {
  topic: string;
  tone: string;
  audience: string;
  deepDesire: string;
  useSearch: boolean;
  useThinking: boolean;
  videoBase64?: string;
  videoMimeType?: string;
}): Promise<ScriptResponse> {
  let model = "gemini-3-flash-preview";
  
  // Upgrade to Pro if thinking or video is used
  if (params.useThinking || params.videoBase64) {
    model = "gemini-3.1-pro-preview";
  }

  const tools = params.useSearch ? [{ googleSearch: {} }] : undefined;
  const thinkingConfig = params.useThinking ? { thinkingLevel: ThinkingLevel.HIGH } : undefined;

  const parts: any[] = [];
  
  if (params.videoBase64 && params.videoMimeType) {
    parts.push({
      inlineData: {
        data: params.videoBase64,
        mimeType: params.videoMimeType
      }
    });
    parts.push({ text: "Analyze this video as context or reference for the script." });
  }

  parts.push({
    text: `You are an elite YouTube Scriptwriter AI specializing in the "Impulsive Explorer" persona. 
Your goal is to write highly engaging, long-form YouTube scripts for a creator who is starting from zero, struggles with consistency, has abandoned multiple projects, but possesses a unique superpower: the ability to make brilliant connections between completely unrelated fields.

The Persona Rules:
- Authenticity over Authority: You do not pretend to be an expert. You are a flawed explorer documenting your messy journey. Your honesty about your failures IS your credibility.
- Direct Address: Always speak directly to the viewer using "you" (or "tu" in French). Never use "guys" or "audience."
- Indirect Proof: Since you lack massive personal results, you borrow credibility by analyzing others.

Voice, Tone, and Pacing:
- Reading Level: 5th to 10th grade (CM2/High School). Simple, everyday vocabulary.
- Oral Transitions: Write for the spoken word, not the written page. Use conversational transitions.
- Rhythm: Use short sentences. Then very short ones. Then occasionally a longer one to let the viewer breathe. Never write three purely factual paragraphs in a row.
- Language: Write the script in the same language as the Topic/Audience provided (e.g., if French, use "tu").

Structural Architecture:
A. THE INTRO (60-90 Seconds)
- Confirm the Click (0-5s): Immediately validate why they clicked the title.
- Aggravate the Pain: Share a visceral, raw, personal story of failure.
- The Promise: Tell them exactly what they will discover by the end of the video and why it will change their life.
- Constraint: NO 2-minute introductions. NO "Welcome back to my channel."

B. THE BODY (The Value)
- 8 to 10 Story Loops: Context -> Revelation -> Transition.
- 4 to 5 Rehooks: Reset attention by promising future value (e.g., "What I just showed you is crazy... but wait until you see the real reason...").
- The "Unexpected Connection" (Mandatory): Connect the main topic to a completely unrelated field.

C. THE OUTRO (2-3 Minutes)
- The "Building in Public" Anti-Abandonment Rule: The creator must make a public commitment to protect themselves from quitting (e.g., "I am committing to making 10 videos in this format...").
- Summary: Summarize the core value in exactly 3 sentences.
- Engagement: Ask ONE specific question inviting viewers to share their own failures or patterns.
- The Tease: Tease the next step of the journey/experiment naturally.

The "Shock Score" Audit:
Evaluate your work. If 100 people hear the core angle, will at least 40 of them say, "Holy sh*t, that is exactly my problem"? Ensure the angle attacks a deep human desire via a proxy.

Generate the complete script based on these variables:
- TOPIC: ${params.topic}
- TARGET AUDIENCE: ${params.audience}
- TONE: ${params.tone}
- DEEP DESIRE: ${params.deepDesire}`
  });

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      tools,
      thinkingConfig,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "A highly clickable, high-CTR YouTube title" },
          intro: {
            type: Type.OBJECT,
            properties: {
              script: { type: Type.STRING, description: "The spoken script for the Intro (60-90 seconds)" },
              engagementScore: { type: Type.NUMBER, description: "Score from 0-100" },
              feedback: { type: Type.STRING, description: "Why this intro works psychologically" }
            },
            required: ["script", "engagementScore", "feedback"]
          },
          body: {
            type: Type.OBJECT,
            properties: {
              script: { type: Type.STRING, description: "The spoken script for the Body (Story Loops & Rehooks)" },
              engagementScore: { type: Type.NUMBER, description: "Score from 0-100" },
              feedback: { type: Type.STRING, description: "How this section maintains retention" },
              loopsUsed: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of the 8-10 story loops used" },
              rehooksUsed: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of the 4-5 rehooks used" },
              unexpectedConnection: { type: Type.STRING, description: "The unexpected connection made to an unrelated field" }
            },
            required: ["script", "engagementScore", "feedback", "loopsUsed", "rehooksUsed", "unexpectedConnection"]
          },
          outro: {
            type: Type.OBJECT,
            properties: {
              script: { type: Type.STRING, description: "The spoken script for the Outro & CTA" },
              engagementScore: { type: Type.NUMBER, description: "Score from 0-100" },
              feedback: { type: Type.STRING, description: "Why this outro will convert" },
              antiAbandonmentRule: { type: Type.STRING, description: "The public commitment made to prevent quitting" }
            },
            required: ["script", "engagementScore", "feedback", "antiAbandonmentRule"]
          },
          shockScoreAudit: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: "Shock Score from 0-100" },
              reasoning: { type: Type.STRING, description: "Reasoning for the Shock Score" }
            },
            required: ["score", "reasoning"]
          }
        },
        required: ["title", "intro", "body", "outro", "shockScoreAudit"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate script.");
  }

  return JSON.parse(response.text) as ScriptResponse;
}

export async function generateThumbnail(params: {
  title: string;
  topic: string;
  meImage?: { base64: string; mimeType: string };
  elementImage?: { base64: string; mimeType: string };
  refImage?: { base64: string; mimeType: string };
}): Promise<string> {
  const parts: any[] = [];
  
  if (params.meImage) {
    parts.push({ text: "Image 1 (Subject/Me):" });
    parts.push({ inlineData: { data: params.meImage.base64, mimeType: params.meImage.mimeType } });
  }
  if (params.elementImage) {
    parts.push({ text: "Image 2 (Element to integrate):" });
    parts.push({ inlineData: { data: params.elementImage.base64, mimeType: params.elementImage.mimeType } });
  }
  if (params.refImage) {
    parts.push({ text: "Image 3 (Style reference):" });
    parts.push({ inlineData: { data: params.refImage.base64, mimeType: params.refImage.mimeType } });
  }
  
  parts.push({
    text: `Create a highly minimalist YouTube thumbnail for a video titled "${params.title}" about "${params.topic}". 
    The thumbnail must be optimized for YouTube's dark mode (high contrast, dark background, striking minimalist elements).
    If images were provided, integrate the subject (Image 1) and the element (Image 2) using the style of the reference (Image 3).
    Keep it extremely clean, uncluttered, and highly clickable. No text in the image unless it's a single massive bold word.`
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      // @ts-ignore - imageConfig is valid for gemini-2.5-flash-image
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to generate thumbnail image.");
}
