
import React, { useState } from 'react';
import { Step, Language, VoiceOption, ProductionData } from './types';
import { generateProductionData, generateVoicePreview, generatePartAudio } from './services/geminiService';
import { 
  Trophy, 
  Settings2, 
  Newspaper, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  RefreshCcw,
  Mic2,
  ChevronRight,
  AlertCircle,
  Loader2,
  Volume2,
  Play,
  Download,
  Music
} from 'lucide-react';

const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'v1', name: 'Narrador Esportivo Dinâmico', style: 'Energia alta, rápido, focado em ação.' },
  { id: 'v2', name: 'Comentarista Sério', style: 'Analítico, voz grave, credibilidade.' },
  { id: 'v3', name: 'Narrador de Suspense/Clickbait', style: 'Misterioso, pausas dramáticas, urgência.' },
  { id: 'v4', name: 'Voz Jovem e Rápida', style: 'Estilo TikTok/Reels, gírias, ritmo acelerado.' }
];

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.CONFIG);
  const [language, setLanguage] = useState<Language>('Português');
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICE_OPTIONS[0]);
  const [newsInput, setNewsInput] = useState('');
  const [data, setData] = useState<ProductionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // State for script audio
  const [partAudioUrls, setPartAudioUrls] = useState<Record<number, string>>({});
  const [generatingAudioIds, setGeneratingAudioIds] = useState<Set<number>>(new Set());

  const handleStartProcess = async () => {
    if (!newsInput.trim()) return;
    setLoading(true);
    setStep(Step.PROCESSING);
    setError(null);
    setPartAudioUrls({});

    try {
      const result = await generateProductionData(newsInput, language, selectedVoice);
      setData(result);
      setStep(Step.RESULT);
    } catch (err) {
      setError('Erro ao processar a notícia. Verifique sua conexão ou tente novamente.');
      setStep(Step.INPUT);
    } finally {
      setLoading(false);
    }
  };

  const handleVoicePreview = async (e: React.MouseEvent, voice: VoiceOption) => {
    e.stopPropagation();
    if (previewingId) return;
    setPreviewingId(voice.id);
    try {
      await generateVoicePreview(language, voice.id);
    } catch (err) {
      console.error('Failed to preview voice', err);
    } finally {
      setPreviewingId(null);
    }
  };

  const handleGenerateAudioForPart = async (partId: number, text: string) => {
    if (generatingAudioIds.has(partId)) return;
    
    setGeneratingAudioIds(prev => new Set(prev).add(partId));
    try {
      const blob = await generatePartAudio(text, selectedVoice.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPartAudioUrls(prev => ({ ...prev, [partId]: url }));
      }
    } catch (err) {
      console.error('Error generating part audio', err);
    } finally {
      setGeneratingAudioIds(prev => {
        const next = new Set(prev);
        next.delete(partId);
        return next;
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const reset = () => {
    setStep(Step.CONFIG);
    setNewsInput('');
    setData(null);
    setPartAudioUrls({});
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 p-2 rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.3)]">
              <Trophy className="text-slate-950 w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bebas tracking-wider uppercase text-yellow-500">
              Football Dark Producer
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400">
            <div className={`px-3 py-1 rounded-full border ${step === Step.CONFIG ? 'border-yellow-500 text-yellow-500' : 'border-slate-800'}`}>1. CONFIG</div>
            <ChevronRight size={14} />
            <div className={`px-3 py-1 rounded-full border ${step === Step.INPUT ? 'border-yellow-500 text-yellow-500' : 'border-slate-800'}`}>2. NOTÍCIA</div>
            <ChevronRight size={14} />
            <div className={`px-3 py-1 rounded-full border ${step === Step.RESULT ? 'border-yellow-500 text-yellow-500' : 'border-slate-800'}`}>3. PRODUÇÃO</div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {step === Step.CONFIG && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Settings2 className="text-yellow-500" />
                <h2 className="text-xl font-bold">Configuração Inicial</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-3">Idioma do Roteiro</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['Português', 'English', 'Español'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang as Language)}
                        className={`px-4 py-3 rounded-xl border text-left transition-all ${
                          language === lang 
                            ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' 
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-3">Voz Desejada (Estilo)</label>
                  <div className="space-y-2">
                    {VOICE_OPTIONS.map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice)}
                        className={`w-full px-4 py-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                          selectedVoice.id === voice.id 
                            ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' 
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-semibold">{voice.name}</div>
                          <div className="text-xs text-slate-400 group-hover:text-slate-300">{voice.style}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleVoicePreview(e, voice)}
                            disabled={previewingId !== null}
                            className={`p-2 rounded-full transition-colors ${
                              previewingId === voice.id 
                                ? 'bg-yellow-500 text-slate-950' 
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            }`}
                            title="Ouvir prévia"
                          >
                            {previewingId === voice.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Play size={14} fill="currentColor" />
                            )}
                          </button>
                          <Volume2 className={selectedVoice.id === voice.id ? 'text-yellow-500' : 'text-slate-600'} size={18} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setStep(Step.INPUT)}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-8 py-3 rounded-xl transition-all flex items-center gap-2 group"
                >
                  Próximo Passo <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </section>
          </div>
        )}

        {step === Step.INPUT && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <Newspaper className="text-yellow-500" />
                <h2 className="text-xl font-bold">Fonte da Notícia</h2>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Cole a notícia original, artigo ou fatos abaixo. Eu cuidarei da reescrita viral.
              </p>
              <textarea
                value={newsInput}
                onChange={(e) => setNewsInput(e.target.value)}
                placeholder="Ex: O Real Madrid acaba de confirmar a contratação de..."
                className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all outline-none resize-none"
              />
              
              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setStep(Step.CONFIG)}
                  className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
                >
                  Voltar para ajustes
                </button>
                <button
                  onClick={handleStartProcess}
                  disabled={!newsInput.trim()}
                  className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold px-8 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-yellow-500/20"
                >
                  <Sparkles size={18} /> Gerar Produção
                </button>
              </div>
            </div>
          </div>
        )}

        {step === Step.PROCESSING && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-pulse">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full"></div>
              <Loader2 className="w-16 h-16 text-yellow-500 animate-spin relative z-10" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-yellow-500">Criando Magia...</h2>
              <p className="text-slate-400">Reescrevendo roteiro, gerando blocos de áudio e otimizando SEO.</p>
            </div>
          </div>
        )}

        {step === Step.RESULT && data && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
            {/* Reworked Script Sections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mic2 className="text-yellow-500" />
                  <h2 className="text-2xl font-bebas tracking-wide">Roteiro para Áudio (Blocos)</h2>
                </div>
                <button 
                  onClick={reset}
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-yellow-500 transition-colors"
                >
                  <RefreshCcw size={14} /> Novo Roteiro
                </button>
              </div>

              {data.reworkedScript.map((block) => (
                <div key={block.part} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg group">
                  <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-yellow-500">PARTE {block.part} - ÁUDIO</span>
                      <div className="h-1 w-1 bg-slate-600 rounded-full"></div>
                      <span className="text-[10px] text-slate-500 font-mono">{block.text.length} caracteres</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => copyToClipboard(block.text)}
                        className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white flex items-center gap-1.5 text-[10px]"
                        title="Copiar texto"
                      >
                        <Copy size={12} /> COPIAR
                      </button>
                      
                      {partAudioUrls[block.part] ? (
                        <a 
                          href={partAudioUrls[block.part]} 
                          download={`Parte_${block.part}_${selectedVoice.name.replace(/\s+/g, '_')}.wav`}
                          className="p-1.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded hover:bg-green-500/20 transition-all flex items-center gap-1.5 text-[10px] font-bold"
                        >
                          <Download size={12} /> BAIXAR ÁUDIO
                        </a>
                      ) : (
                        <button 
                          onClick={() => handleGenerateAudioForPart(block.part, block.text)}
                          disabled={generatingAudioIds.has(block.part)}
                          className="p-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded hover:bg-yellow-500/20 transition-all flex items-center gap-1.5 text-[10px] font-bold disabled:opacity-50"
                        >
                          {generatingAudioIds.has(block.part) ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Music size={12} />
                          )}
                          GERAR ÁUDIO
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{block.text}</p>
                    
                    {partAudioUrls[block.part] && (
                      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-4">
                        <audio controls src={partAudioUrls[block.part]} className="h-8 w-full accent-yellow-500" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Titles & SEO */}
            <div className="grid md:grid-cols-2 gap-6">
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Sparkles size={18} className="text-yellow-500" /> Títulos Magnéticos
                  </h3>
                  <button 
                    onClick={() => copyToClipboard(data.titles.join('\n'))}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    COPIAR TUDO
                  </button>
                </div>
                <div className="space-y-3">
                  {data.titles.map((title, idx) => (
                    <div key={idx} className="group flex items-start gap-3 p-3 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all cursor-pointer" onClick={() => copyToClipboard(title)}>
                      <span className="text-yellow-500 font-bebas text-lg leading-none">{idx + 1}</span>
                      <p className="text-sm text-slate-300 group-hover:text-white leading-tight">{title}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="space-y-6">
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Descrição (SEO)</h3>
                    <button 
                      onClick={() => copyToClipboard(data.description)}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      COPIAR
                    </button>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <p className="text-sm text-slate-400 leading-relaxed italic">
                      "{data.description}"
                    </p>
                    <div className="mt-3 text-[10px] text-slate-600 text-right">
                      ~150 Palavras Otimizadas
                    </div>
                  </div>
                </section>

                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Tags (Palavras-Chave)</h3>
                    <button 
                      onClick={() => copyToClipboard(data.tags.join(', '))}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      COPIAR
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-slate-800 rounded text-[10px] text-slate-300 border border-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            {/* Footer Summary */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-500 p-3 rounded-full shadow-lg shadow-yellow-500/20">
                  <CheckCircle2 className="text-slate-950" />
                </div>
                <div>
                  <h4 className="font-bold text-yellow-500 uppercase tracking-wide">Fluxo Concluído!</h4>
                  <p className="text-xs text-slate-400">Roteiro, áudio, SEO e tags prontos para o YouTube.</p>
                </div>
              </div>
              <button 
                onClick={reset}
                className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all border border-slate-700 hover:border-slate-500"
              >
                Novo Trabalho
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-4">
          <p className="text-slate-500 text-xs text-center">
            Ferramenta para Especialistas em Canais Dark de Futebol. 
            IA otimizada para retenção e CTR.
          </p>
          <div className="flex gap-4 opacity-50">
            <Trophy size={16} />
            <Sparkles size={16} />
            <Mic2 size={16} />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
