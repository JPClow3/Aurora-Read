
import { GeminiVoice } from './types';

export const GEMINI_VOICES: { id: GeminiVoice; name: string; gender: string; description: string; sampleText: string; }[] = [
    { id: 'echo', name: 'Echo', gender: 'Male', description: 'Deep and resonant, suitable for narration.', sampleText: 'Hello, I am Echo. This is how my voice sounds.' },
    { id: 'onyx', name: 'Onyx', gender: 'Male', description: 'A clear and professional voice, great for instructional content.', sampleText: 'Hello, I am Onyx. This is how my voice sounds.' },
    { id: 'fable', name: 'Fable', gender: 'Male', description: 'A warm and engaging voice, perfect for storytelling.', sampleText: 'Hello, I am Fable. This is how my voice sounds.'},
    { id: 'nova', name: 'Nova', gender: 'Female', description: 'A calm and soothing voice, ideal for long-form listening.', sampleText: 'Hello, I am Nova. This is how my voice sounds.' },
    { id: 'shimmer', name: 'Shimmer', gender: 'Female', description: 'Bright and energetic, excellent for engaging content.', sampleText: 'Hello, I am Shimmer. This is how my voice sounds.' },
    { id: 'alloy', name: 'Alloy', gender: 'Female', description: 'A neutral and versatile voice for various applications.', sampleText: 'Hello, I am Alloy. This is how my voice sounds.'},
];

export const synthesizeSpeech = async (text: string, voice: GeminiVoice): Promise<string> => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API key is not available.");
    
    // NOTE: The TTS API generates audio at a normal (1.0) rate. Playback speed adjustments
    // are handled client-side via the <audio> element's playbackRate property. This avoids
    // re-fetching audio from the API every time the user adjusts the speed slider.
    const url = `https://generativelanguage.googleapis.com/v1/models/text-to-speech:generateSpeech?key=${API_KEY}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: "models/text-to-speech",
            text: text,
            voice: {
                name: `voices/${voice}`
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
