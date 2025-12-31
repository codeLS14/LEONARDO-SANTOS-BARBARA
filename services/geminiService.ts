
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProductionData, Language, VoiceOption } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Voice mapping for Gemini TTS
const VOICE_MAP: Record<string, string> = {
  'v1': 'Kore',
  'v2': 'Puck',
  'v3': 'Charon',
  'v4': 'Fenrir'
};

export const generateProductionData = async (
  newsText: string,
  language: Language,
  voice: VoiceOption
): Promise<ProductionData> => {
  const prompt = `
    Como um Especialista em Roteirização e Produção para Canais Dark de Futebol, transforme a seguinte notícia em um roteiro viral de alta retenção.
    
    IDIOMA: ${language}
    ESTILO DE NARRAÇÃO: ${voice.name} (${voice.style})
    
    REGRAS OBRIGATÓRIAS:
    1. Reescrita Criativa: Use linguagem de curiosidade, urgência e "ganchos" constantes (hooks).
    2. Segmentação: Divida o texto em partes de no máximo 1800 caracteres cada.
    3. Metadados: 
       - 10 Títulos Magnéticos (CTR Alto/Clickbait de Qualidade).
       - Descrição de EXATAMENTE 150 palavras focada em SEO.
       - 15 Tags separadas por vírgula.
    
    NOTÍCIA ORIGINAL:
    ${newsText}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reworkedScript: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                part: { type: Type.INTEGER },
                text: { type: Type.STRING }
              },
              required: ["part", "text"]
            }
          },
          titles: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          description: { type: Type.STRING },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["reworkedScript", "titles", "description", "tags"]
      }
    }
  });

  const result = JSON.parse(response.text || '{}');
  return result as ProductionData;
};

export const generateVoicePreview = async (language: Language, voiceId: string) => {
  const voiceName = VOICE_MAP[voiceId] || 'Kore';
  
  const textMap: Record<Language, string> = {
    'Português': 'Olá! Eu sou sua nova voz para este canal de futebol. Vamos criar um conteúdo viral hoje?',
    'English': 'Hello! I am your new voice for this football channel. Shall we create some viral content today?',
    'Español': '¡Hola! Soy tu nueva voz para este canal de fútbol. ¿Creamos contenido viral hoy?'
  };

  const audioBase64 = await requestAudio(textMap[language], voiceName);
  if (audioBase64) {
    await playRawPcm(audioBase64);
  }
};

export const generatePartAudio = async (text: string, voiceId: string): Promise<Blob | null> => {
  const voiceName = VOICE_MAP[voiceId] || 'Kore';
  const audioBase64 = await requestAudio(text, voiceName);
  if (!audioBase64) return null;

  const bytes = decodeBase64(audioBase64);
  return createWavBlob(bytes, 24000);
};

async function requestAudio(text: string, voiceName: string): Promise<string | undefined> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }
        }
      }
    }
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

async function playRawPcm(base64: string) {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const bytes = decodeBase64(base64);
  const audioBuffer = await decodeAudioData(bytes, audioContext, 24000, 1);
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
}

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createWavBlob(pcmData: Uint8Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + pcmData.length, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, pcmData.length, true);

  // Write the PCM data
  for (let i = 0; i < pcmData.length; i++) {
    view.setUint8(44 + i, pcmData[i]);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
