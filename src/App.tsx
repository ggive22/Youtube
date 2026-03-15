import React, { useState, useRef } from 'react';
import { generateYouTubeScript, generateThumbnail, ScriptResponse } from './gemini';
import { 
  Video, Search, BrainCircuit, Sparkles, Loader2, Play, 
  TrendingUp, MessageSquare, Target, AlertCircle, Upload, 
  ChevronDown, Image as ImageIcon, Settings2, X, Download
} from 'lucide-react';

type ImageState = { file: File; base64: string; mimeType: string } | null;

const Accordion = ({ title, children, defaultOpen = false, icon: Icon, value }: { title: string, children: React.ReactNode, defaultOpen?: boolean, icon?: any, value?: string }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-800/50 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full py-4 flex items-center justify-between text-zinc-400 hover:text-zinc-100 transition-colors group"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-4 h-4" />}
          <span className="text-sm tracking-wide">{title}</span>
          {value && <span className="text-xs text-zinc-600 truncate max-w-[200px] hidden sm:block">{value}</span>}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-zinc-100' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 pb-4' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

const ImageUpload = ({ label, fileState, setFileState }: { label: string, fileState: ImageState, setFileState: (s: ImageState) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 mb-2">{label}</label>
      <input type="file" accept="image/*" className="hidden" ref={inputRef} onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) {
          const reader = new FileReader();
          reader.onloadend = () => setFileState({ file: f, base64: (reader.result as string).split(',')[1], mimeType: f.type });
          reader.readAsDataURL(f);
        }
      }} />
      {!fileState ? (
        <button onClick={() => inputRef.current?.click()} className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/50 transition-all text-xs text-zinc-400">
          <Upload className="w-3 h-3" />
          Upload
        </button>
      ) : (
        <div className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50 aspect-video flex items-center justify-center">
          <img src={`data:${fileState.mimeType};base64,${fileState.base64}`} alt={label} className="object-cover w-full h-full opacity-50 group-hover:opacity-30 transition-opacity" />
          <button onClick={() => setFileState(null)} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/80 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
              <X className="w-3 h-3" /> Remove
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Charismatic');
  const [audience, setAudience] = useState('');
  const [deepDesire, setDeepDesire] = useState('Freedom');
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  
  const [meImage, setMeImage] = useState<ImageState>(null);
  const [elementImage, setElementImage] = useState<ImageState>(null);
  const [refImage, setRefImage] = useState<ImageState>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [scriptData, setScriptData] = useState<ScriptResponse | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic) {
      setError("Veuillez entrer un sujet de vidéo.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setScriptData(null);
    setThumbnailUrl(null);
    
    try {
      const result = await generateYouTubeScript({
        topic,
        tone,
        audience: audience || "Audience YouTube Générale",
        deepDesire,
        useSearch,
        useThinking,
      });
      setScriptData(result);

      try {
        const thumbUrl = await generateThumbnail({
          title: result.title,
          topic,
          meImage,
          elementImage,
          refImage
        });
        setThumbnailUrl(thumbUrl);
      } catch (thumbErr) {
        console.error("Erreur miniature:", thumbErr);
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Une erreur s'est produite.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 75) return "text-amber-400";
    return "text-rose-400";
  };

  const handleDownloadThumbnail = () => {
    if (!thumbnailUrl) return;
    const a = document.createElement('a');
    a.href = thumbnailUrl;
    a.download = `miniature-viralscript.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white/20">
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-24">
        
        {/* Header Minimaliste */}
        <div className="mb-12 text-center">
          <h1 className="text-2xl font-light tracking-widest uppercase text-white mb-2">ViralScript</h1>
          <p className="text-xs text-zinc-500 tracking-wide">Générateur de Script & Miniature</p>
        </div>

        {/* Input Principal */}
        <div className="mb-8">
          <textarea 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="De quoi parle votre vidéo ? (ex: J'ai tout abandonné après 7 jours...)"
            className="w-full bg-transparent border-b border-zinc-800 pb-4 text-xl md:text-2xl font-light text-white placeholder:text-zinc-700 focus:outline-none focus:border-white transition-colors resize-none h-20 md:h-24"
          />
        </div>

        {/* Encoches (Accordions) pour les paramètres */}
        <div className="mb-12 border-t border-zinc-800/50">
          <Accordion title="Paramètres du Script" icon={Settings2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-2">Audience Cible</label>
                <input 
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="ex: Entrepreneurs débutants"
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-2">Ton de Voix</label>
                <select 
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors appearance-none"
                >
                  <option value="Charismatic">Charismatique & Énergique</option>
                  <option value="Educational">Éducatif & Autoritaire</option>
                  <option value="Relatable">Authentique & Vulnérable</option>
                  <option value="Dramatic">Dramatique & Narratif</option>
                  <option value="Controversial">Controversé & Clivant</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-2">Désir Profond</label>
                <select 
                  value={deepDesire}
                  onChange={(e) => setDeepDesire(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors appearance-none"
                >
                  <option value="Freedom">Liberté & Indépendance</option>
                  <option value="Money">Argent & Richesse</option>
                  <option value="Time">Temps & Efficacité</option>
                  <option value="Recognition">Reconnaissance & Statut</option>
                </select>
              </div>
              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" checked={useSearch} onChange={(e) => setUseSearch(e.target.checked)} className="peer sr-only" />
                    <div className="w-4 h-4 border border-zinc-600 rounded-sm bg-transparent peer-checked:bg-white peer-checked:border-white transition-all"></div>
                  </div>
                  <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">Recherche Google en direct</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" checked={useThinking} onChange={(e) => setUseThinking(e.target.checked)} className="peer sr-only" />
                    <div className="w-4 h-4 border border-zinc-600 rounded-sm bg-transparent peer-checked:bg-white peer-checked:border-white transition-all"></div>
                  </div>
                  <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">Analyse Psychologique Profonde (Pro)</span>
                </label>
              </div>
            </div>
          </Accordion>

          <Accordion title="Génération de Miniature" icon={ImageIcon}>
            <div className="pt-2">
              <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                Ajoutez des images pour guider l'IA dans la création d'une miniature minimaliste, optimisée pour le dark mode de YouTube.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ImageUpload label="1. Image de Vous (Selfie)" fileState={meImage} setFileState={setMeImage} />
                <ImageUpload label="2. Élément à intégrer" fileState={elementImage} setFileState={setElementImage} />
                <ImageUpload label="3. Style de Référence" fileState={refImage} setFileState={setRefImage} />
              </div>
            </div>
          </Accordion>
        </div>

        {/* Bouton Générer */}
        <div className="flex flex-col items-center">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !topic}
            className="bg-white text-black px-8 py-3 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                Générer le Pack Complet
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
          
          {error && (
            <div className="mt-6 flex items-center gap-2 text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Résultats */}
        {scriptData && (
          <div className="mt-24 space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Titre & Miniature */}
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Titre Optimisé</h2>
                <h1 className="text-3xl md:text-4xl font-light text-white leading-tight">{scriptData.title}</h1>
              </div>

              {thumbnailUrl ? (
                <div className="relative group rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
                  <img src={thumbnailUrl} alt="Miniature Générée" className="w-full h-auto object-cover aspect-video" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button 
                      onClick={handleDownloadThumbnail}
                      className="bg-white text-black px-6 py-3 rounded-full text-sm font-medium hover:scale-105 transition-transform flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger (Format 16:9)
                    </button>
                  </div>
                </div>
              ) : isGenerating ? (
                <div className="rounded-2xl border border-zinc-800 border-dashed aspect-video flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/20">
                  <Loader2 className="w-6 h-6 animate-spin mb-3" />
                  <p className="text-sm">Génération de la miniature...</p>
                </div>
              ) : null}
            </div>

            {/* Script Sections */}
            <div className="border-t border-zinc-800/50">
              <Accordion title="1. L'Intro (0:00 - 1:30)" defaultOpen={true}>
                <div className="pt-4 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Script Parlé</span>
                    <span className={`text-sm font-medium ${getScoreColor(scriptData.intro.engagementScore)}`}>Score: {scriptData.intro.engagementScore}/100</span>
                  </div>
                  <div className="text-zinc-300 font-light leading-relaxed whitespace-pre-wrap text-lg">
                    {scriptData.intro.script}
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                    <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Psychologie</h4>
                    <p className="text-sm text-zinc-400">{scriptData.intro.feedback}</p>
                  </div>
                </div>
              </Accordion>

              <Accordion title="2. Le Corps (Story Loops & Rehooks)">
                <div className="pt-4 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Script Parlé</span>
                    <span className={`text-sm font-medium ${getScoreColor(scriptData.body.engagementScore)}`}>Score: {scriptData.body.engagementScore}/100</span>
                  </div>
                  <div className="text-zinc-300 font-light leading-relaxed whitespace-pre-wrap text-lg">
                    {scriptData.body.script}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                      <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Story Loops</h4>
                      <ul className="space-y-2">
                        {scriptData.body.loopsUsed.map((loop, idx) => (
                          <li key={idx} className="text-sm text-zinc-400 flex items-start gap-2">
                            <span className="text-zinc-600 mt-0.5">•</span> {loop}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                        <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Rehooks</h4>
                        <ul className="space-y-2">
                          {scriptData.body.rehooksUsed.map((rehook, idx) => (
                            <li key={idx} className="text-sm text-zinc-400 flex items-start gap-2">
                              <span className="text-zinc-600 mt-0.5">•</span> {rehook}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                        <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Connexion Inattendue</h4>
                        <p className="text-sm text-zinc-400">{scriptData.body.unexpectedConnection}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Accordion>

              <Accordion title="3. L'Outro & CTA">
                <div className="pt-4 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Script Parlé</span>
                    <span className={`text-sm font-medium ${getScoreColor(scriptData.outro.engagementScore)}`}>Score: {scriptData.outro.engagementScore}/100</span>
                  </div>
                  <div className="text-zinc-300 font-light leading-relaxed whitespace-pre-wrap text-lg">
                    {scriptData.outro.script}
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                    <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Règle Anti-Abandon</h4>
                    <p className="text-sm text-zinc-400">{scriptData.outro.antiAbandonmentRule}</p>
                  </div>
                </div>
              </Accordion>

              <Accordion title="Audit Shock Score">
                <div className="pt-4">
                  <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl text-center">
                    <div className={`text-4xl font-light mb-4 ${getScoreColor(scriptData.shockScoreAudit.score)}`}>
                      {scriptData.shockScoreAudit.score}<span className="text-lg text-zinc-500">/100</span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed max-w-lg mx-auto">
                      {scriptData.shockScoreAudit.reasoning}
                    </p>
                  </div>
                </div>
              </Accordion>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
