import { GoogleGenAI, Type } from "@google/genai";
import { ChapterAnalysis, Flashcard, CharacterProfile } from './types';

export const synthesizeSpeech = async (text: string): Promise<string> => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API key is not available.");
    
    const url = `https://generativelanguage.googleapis.com/v1/models/text-to-speech:generateSpeech?key=${API_KEY}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: "models/text-to-speech",
            text: text,
            voice: {
                name: `voices/nova` // Using a default voice for simplicity
            },
            audioConfig: {
              audioEncoding: "MP3",
              speakingRate: 1.0,
              pitch: 0,
              volumeGainDb: 0
            }
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error("Speech Synthesis Error:", error);
        throw new Error(`Speech synthesis failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.audioContent; // This is a base64 string
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const analyzeChapter = async (chapterText: string, sentences: string[]): Promise<ChapterAnalysis> => {
  if (!process.env.API_KEY) throw new Error("API key is not available.");

  const model = 'gemini-2.5-flash';
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      keyPlotPoints: {
        type: Type.ARRAY,
        description: "An array of sentences that represent key plot points or major events in the story.",
        items: { type: Type.STRING }
      },
      characterIntroductions: {
        type: Type.ARRAY,
        description: "An array of sentences where a new significant character is introduced.",
        items: { type: Type.STRING }
      },
      foreshadowing: {
        type: Type.ARRAY,
        description: "An array of sentences that contain hints or clues about future events.",
        items: { type: Type.STRING }
      }
    },
    required: ["keyPlotPoints", "characterIntroductions", "foreshadowing"]
  };

  const prompt = `Analyze the following text from a book chapter. Identify sentences that are key plot points, character introductions, or foreshadowing. The chapter text is: "${chapterText}"`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema,
      systemInstruction: `You are an expert literary analyst. Your task is to analyze a book chapter and extract specific types of sentences. Given the text, you must return a JSON object containing arrays of sentences for each category: 'keyPlotPoints', 'characterIntroductions', and 'foreshadowing'. The sentences in the JSON response must be exact substrings of the provided chapter text.`
    }
  });

  const jsonResponse = JSON.parse(response.text);

  // The model returns arrays of strings (sentences). We need to map them back to sentence indices.
  const findSentenceIndex = (sentenceToFind: string): number => {
    if (!sentenceToFind) return -1;
    const trimmedSentence = sentenceToFind.trim();
    return sentences.findIndex(s => s.trim().includes(trimmedSentence));
  };

  return {
    keyPlotPoints: (jsonResponse.keyPlotPoints || []).map(findSentenceIndex).filter((i: number) => i !== -1),
    characterIntroductions: (jsonResponse.characterIntroductions || []).map(findSentenceIndex).filter((i: number) => i !== -1),
    foreshadowing: (jsonResponse.foreshadowing || []).map(findSentenceIndex).filter((i: number) => i !== -1),
  };
};

export const generateFlashcardsForChapter = async (chapterText: string): Promise<Omit<Flashcard, 'id'>[]> => {
    if (!process.env.API_KEY) throw new Error("API key is not available.");

    const model = 'gemini-2.5-flash';
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            flashcards: {
                type: Type.ARRAY,
                description: "An array of flashcard objects, each with a 'question' and 'answer'.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING, description: "A concise question about a key concept, term, or event from the text." },
                        answer: { type: Type.STRING, description: "The corresponding concise answer to the question." },
                    },
                    required: ["question", "answer"],
                }
            }
        },
        required: ["flashcards"]
    };

    const prompt = `Based on the following chapter text, generate 5-10 flashcards to help a reader study the key information. Each flashcard should have a clear, concise question and a direct answer. Chapter text: "${chapterText}"`;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            systemInstruction: "You are a helpful study assistant. Your goal is to create high-quality, concise flashcards from a text to help users learn."
        }
    });
    
    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.flashcards || [];
};

export const analyzeCharactersInBook = async (bookText: string): Promise<CharacterProfile[]> => {
    if (!process.env.API_KEY) throw new Error("API key is not available.");

    const model = 'gemini-2.5-flash';
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            characters: {
                type: Type.ARRAY,
                description: "An array of character profile objects.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "The character's full name." },
                        summary: { type: Type.STRING, description: "A brief 2-3 sentence summary of the character's role, personality, and major motivations." },
                        relationships: {
                            type: Type.ARRAY,
                            description: "A list of the character's key relationships.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    characterName: { type: Type.STRING, description: "The name of the other character in the relationship." },
                                    relationship: { type: Type.STRING, description: "A brief description of the relationship (e.g., 'Father', 'Rival', 'Mentor')." }
                                },
                                required: ["characterName", "relationship"]
                            }
                        }
                    },
                    required: ["name", "summary", "relationships"]
                }
            }
        },
        required: ["characters"]
    };

    const prompt = `Analyze the following book text and create a detailed list of the main characters. For each character, provide a name, a short summary of their role and personality, and a list of their key relationships with other characters. Text: "${bookText}"`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            systemInstruction: "You are a literary expert, skilled at analyzing characters and their relationships within a narrative."
        }
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.characters || [];
};
