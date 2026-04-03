/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Quote, Users, Brain, ChevronRight, Info, X, Play, Pause, SkipForward, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { supabase } from './lib/supabase';

// Fallback data (used if Supabase is not configured or empty)
const DEFAULT_BROTHERS = [
  {
    id: 'dmitry',
    name: '德米特里 (Dmitry)',
    title: '感性与激情的化身',
    description: '长子，退伍军官。他性格豪爽、冲动，深陷于对金钱和女人的渴望中。他代表了人类天性中未经磨砺的原始激情。',
    color: 'bg-red-900',
    icon: '🔥',
  },
  {
    id: 'ivan',
    name: '伊万 (Ivan)',
    title: '理智与怀疑的化身',
    description: '次子，知识分子。他以冷峻的逻辑挑战上帝的存在，提出了著名的“大审判官”寓言。他代表了现代人的理性危机。',
    color: 'bg-blue-900',
    icon: '❄️',
  },
  {
    id: 'alyosha',
    name: '阿廖沙 (Alyosha)',
    title: '灵性与慈悲的化身',
    description: '幼子，修道士。他是陀氏笔下的“理想人物”，试图通过爱和宽恕来化解家族的仇恨。他代表了信仰的力量。',
    color: 'bg-amber-700',
    icon: '🕊️',
  },
  {
    id: 'smerdyakov',
    name: '斯梅尔佳科夫',
    title: '阴暗与虚无的化身',
    description: '私生子，仆人。他极度自卑又自傲，深受伊万哲学的影响。他是家族悲剧的实际执行者。',
    color: 'bg-gray-800',
    icon: '🐍',
  }
];

const DEFAULT_QUOTES = [
  "“最要紧的是，我们首先要善良，其次要诚实，再其次是以后永远不要互相遗忘。”",
  "“如果上帝不存在，那么一切都是允许的。”",
  "“爱具体的人，不要爱抽象的人类。”",
  "“地狱是什么？我以为地狱就是‘不能再爱’的痛苦。”"
];

// Animation Component
function GrandInquisitorAnimation({ onClose }: { onClose: () => void }) {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [audios, setAudios] = useState<AudioBuffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const STYLE_ANCHOR = "Minimalist high-contrast 2D animation style, black and white charcoal sketch, silhouette figures, dramatic chiaroscuro, grainy texture, deep shadows, cinematic composition.";

  const scenes = [
    {
      title: "镜头 1：光",
      text: "A small glowing light slowly appears in complete darkness.",
      prompt: `${STYLE_ANCHOR} A single tiny glowing white dot in pure infinite blackness, soft pulsing glow, minimalist, centered.`,
      voiceScript: "Inquisitor: You gave them light... SilentOne: ...light?",
      animationType: "zoom-in"
    },
    {
      title: "镜头 2：人群",
      text: "A silhouette crowd stands in darkness, facing a distant glowing light.",
      prompt: `${STYLE_ANCHOR} A crowd of black silhouettes seen from behind, looking towards a distant soft white glow in the center, atmospheric depth.`,
      voiceScript: "Inquisitor: They looked up... SilentOne: We were searching...",
      animationType: "pan-forward"
    },
    {
      title: "镜头 3：同步",
      text: "Rows of silhouette people walking in perfect synchronization.",
      prompt: `${STYLE_ANCHOR} Rows of identical black silhouette people walking in profile, perfect synchronization, mechanical and repetitive, side view.`,
      voiceScript: "Inquisitor: To walk alone... is a burden. SilentOne: No... we can...",
      animationType: "side-scroll"
    },
    {
      title: "镜头 4：压迫",
      text: "A massive glowing golden sphere slowly descending above a crowd.",
      prompt: `${STYLE_ANCHOR} A giant glowing golden sphere descending from the top, overwhelming pressure, crowd of silhouettes reaching upwards with their hands, high contrast.`,
      voiceScript: "Inquisitor: So they chose to exchange. SilentOne: Just a little... Inquisitor: Freedom... for bread.",
      animationType: "sphere-descend"
    },
    {
      title: "镜头 5：轨道",
      text: "A dark central figure, people rotating around it in circular motion.",
      prompt: `${STYLE_ANCHOR} A large dark hooded central figure, small silhouette people moving in a circular orbit around it, top-down perspective, cosmic order.`,
      voiceScript: "Inquisitor: Doubt... for miracle. Uncertainty... for order. Themselves... for authority. SilentOne: ...we were afraid...",
      animationType: "orbit"
    },
    {
      title: "镜头 6：囚禁",
      text: "A glowing figure trapped inside a square frame.",
      prompt: `${STYLE_ANCHOR} A bright glowing white silhouette trapped inside a sharp white square frame, flickering light, dark background, claustrophobic.`,
      voiceScript: "Inquisitor: You gave them choice. We gave them answers. SilentOne: ...that is not an answer...",
      animationType: "shake"
    },
    {
      title: "镜头 7：接触",
      text: "A glowing figure touches a dark silhouette, soft light burst.",
      prompt: `${STYLE_ANCHOR} Close up of a glowing white figure touching a dark black silhouette, a soft burst of light at the point of contact, emotional and spiritual.`,
      voiceScript: "SilentOne: ...why...",
      animationType: "burst"
    },
    {
      title: "镜头 8：秩序",
      text: "Silhouette people standing still in perfect order.",
      prompt: `${STYLE_ANCHOR} A vast grid of silhouette people standing perfectly still, geometric order, infinite perspective, silent and cold.`,
      voiceScript: "Inquisitor: They are finally silent. Finally... happy.",
      animationType: "still"
    },
    {
      title: "镜头 9：结尾",
      text: "A tiny distant light flickering in darkness, fading out.",
      prompt: `${STYLE_ANCHOR} A very small flickering light in the far distance of a vast black void, fading into nothingness, melancholic.`,
      voiceScript: "Inquisitor: And you... SilentOne: We are... still here.",
      animationType: "fade-out"
    }
  ];

  useEffect(() => {
    async function generateAssets() {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const generatedImages: string[] = [];
      const generatedAudios: AudioBuffer[] = [];
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      const callWithRetry = async (fn: () => Promise<any>, retries = 5, delay = 5000) => {
        for (let i = 0; i < retries; i++) {
          try {
            return await fn();
          } catch (error: any) {
            const errorMsg = error?.message || String(error);
            const isRateLimit = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota");
            
            if (isRateLimit) {
              const jitter = Math.random() * 1000;
              const waitTime = (delay * Math.pow(2, i)) + jitter; // Exponential backoff: 5s, 10s, 20s, 40s, 80s
              console.warn(`Rate limit hit, retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${retries})`);
              await sleep(waitTime);
              continue;
            }
            throw error;
          }
        }
        throw new Error("AI 生成配额已耗尽或请求过于频繁。请稍后再试，或者在 Supabase 中配置您的 API Key 以获得更高配额。");
      };

      try {
        // Check Supabase Cache first
        if (supabase) {
          const { data: cachedScenes, error: cacheError } = await supabase
            .from('scenes_cache')
            .select('*')
            .order('scene_index', { ascending: true });

          if (!cacheError && cachedScenes && cachedScenes.length === scenes.length) {
            console.log("Using cached scenes from Supabase");
            for (const scene of cachedScenes) {
              generatedImages.push(scene.image_url);
              
              const binaryString = atob(scene.audio_data);
              const len = binaryString.length;
              const bytes = new Int16Array(len / 2);
              for (let j = 0; j < len; j += 2) {
                bytes[j / 2] = (binaryString.charCodeAt(j+1) << 8) | binaryString.charCodeAt(j);
              }
              const audioBuffer = audioCtx.createBuffer(1, bytes.length, 24000);
              const channelData = audioBuffer.getChannelData(0);
              for (let j = 0; j < bytes.length; j++) {
                channelData[j] = bytes[j] / 32768;
              }
              generatedAudios.push(audioBuffer);
            }
            setImages(generatedImages);
            setAudios(generatedAudios);
            setLoadingProgress(100);
            setLoading(false);
            return;
          }
        }

        for (let i = 0; i < scenes.length; i++) {
          setLoadingProgress(Math.round(((i) / scenes.length) * 100));
          
          // Generate Image
          const imgResponse = await callWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: scenes[i].prompt }] },
            config: { imageConfig: { aspectRatio: "16:9" } }
          }));
          
          const imgPart = imgResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
          let base64Img = "";
          if (imgPart?.inlineData) {
            base64Img = `data:image/png;base64,${imgPart.inlineData.data}`;
            generatedImages.push(base64Img);
          }

          await sleep(3000);

          // Generate Multi-Speaker Voiceover
          const ttsResponse = await callWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `TTS the following dialogue: ${scenes[i].voiceScript}` }] }],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                multiSpeakerVoiceConfig: {
                  speakerVoiceConfigs: [
                    { speaker: 'Inquisitor', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
                    { speaker: 'SilentOne', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
                  ]
                }
              }
            }
          }));

          const audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (audioData) {
            const binaryString = atob(audioData);
            const len = binaryString.length;
            const bytes = new Int16Array(len / 2);
            for (let j = 0; j < len; j += 2) {
              bytes[j / 2] = (binaryString.charCodeAt(j+1) << 8) | binaryString.charCodeAt(j);
            }
            
            const audioBuffer = audioCtx.createBuffer(1, bytes.length, 24000);
            const channelData = audioBuffer.getChannelData(0);
            for (let j = 0; j < bytes.length; j++) {
              channelData[j] = bytes[j] / 32768;
            }
            generatedAudios.push(audioBuffer);

            // Cache to Supabase (Fire and forget, don't block UI)
            if (supabase) {
              supabase.from('scenes_cache').upsert({
                scene_index: i,
                image_url: base64Img,
                audio_data: audioData,
                prompt: scenes[i].prompt,
                voice_script: scenes[i].voiceScript
              }).then(({ error }) => {
                if (error) console.warn("Caching failed:", error);
              });
            }
          }

          if (i < scenes.length - 1) {
            await sleep(5000);
          }
        }
        setImages(generatedImages);
        setAudios(generatedAudios);
        setLoadingProgress(100);
        setLoading(false);
      } catch (error: any) {
        console.error("Asset generation failed:", error);
        setError(error?.message || "生成失败，请稍后重试。");
        setLoading(false);
      }
    }
    generateAssets();
  }, []);

  useEffect(() => {
    if (!isPlaying || loading || !audios || !audios[currentScene]) return;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const source = audioCtx.createBufferSource();
    source.buffer = audios[currentScene];
    source.connect(audioCtx.destination);
    source.start();

    source.onended = () => {
      if (currentScene < scenes.length - 1) {
        setTimeout(() => setCurrentScene(prev => prev + 1), 1500);
      } else {
        setIsPlaying(false);
      }
    };

    return () => {
      try { source.stop(); } catch(e) {}
      audioCtx.close();
    };
  }, [currentScene, isPlaying, loading, audios]);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-stone-400 p-6 text-center">
        <div className="mb-8 p-4 bg-red-900/20 border border-red-900/50 rounded-xl max-w-md">
          <Info className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-serif text-stone-100 mb-2">生成过程中遇到问题</h3>
          <p className="text-sm opacity-80 mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-full text-sm transition-colors"
            >
              刷新页面
            </button>
            <button 
              onClick={onClose} 
              className="px-6 py-2 bg-red-900/40 hover:bg-red-900/60 text-white rounded-full text-sm transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-stone-400">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="mb-8"
        >
          <Brain className="w-16 h-16 text-amber-600" />
        </motion.div>
        <div className="w-64 h-1 bg-stone-900 rounded-full overflow-hidden mb-4">
          <motion.div 
            className="h-full bg-amber-600"
            initial={{ width: 0 }}
            animate={{ width: `${loadingProgress}%` }}
          />
        </div>
        <p className="text-xl font-serif italic text-stone-200">正在生成九幕剧场...</p>
        <p className="text-sm mt-2 opacity-60">AI 正在根据分镜脚本绘制原画并合成双人配音 ({loadingProgress}%)</p>
      </div>
    );
  }

  const renderAnimation = () => {
    const type = scenes[currentScene].animationType;
    
    switch(type) {
      case "zoom-in":
        return { scale: [1, 1.5], opacity: [0, 1] };
      case "pan-forward":
        return { scale: [1, 1.2], y: [0, -20] };
      case "side-scroll":
        return { x: [-50, 50] };
      case "sphere-descend":
        return { y: [-100, 0], scale: [0.8, 1.1] };
      case "orbit":
        return { rotate: [0, 360] };
      case "shake":
        return { x: [-2, 2, -2, 2, 0], opacity: [0.8, 1, 0.8, 1] };
      case "burst":
        return { scale: [1, 1.05], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] };
      case "fade-out":
        return { opacity: [1, 0], scale: [1, 0.9] };
      default:
        return { scale: 1.05 };
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black overflow-hidden flex flex-col"
    >
      {/* Controls */}
      <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-30 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-serif font-bold text-amber-500 leading-none mb-1">{scenes[currentScene].title}</h2>
            <p className="text-[10px] text-stone-500 uppercase tracking-[0.2em]">The Grand Inquisitor • 9 Scenes</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md border border-white/10">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Animation Canvas */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <motion.div 
              animate={renderAnimation()}
              transition={{ duration: 10, ease: "linear" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <img 
                src={images[currentScene]} 
                className="w-full h-full object-cover"
                alt={scenes[currentScene].title}
              />
            </motion.div>
            
            {/* Overlay Layers */}
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.9)]"></div>
          </motion.div>
        </AnimatePresence>

        {/* Dynamic Subtitles */}
        <div className="absolute bottom-0 inset-x-0 p-16 text-center z-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <p className="text-xl md:text-3xl font-serif leading-relaxed text-stone-100 drop-shadow-2xl">
                {scenes[currentScene].voiceScript.split(': ').map((part, i) => (
                  <span key={i} className={i % 2 === 0 ? "text-stone-100" : "text-amber-500/80 italic"}>
                    {i > 0 ? ` "${part}"` : part}
                  </span>
                ))}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-stone-900 w-full relative z-30">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${((currentScene + 1) / scenes.length) * 100}%` }}
          className="absolute inset-y-0 left-0 bg-amber-600"
        />
      </div>
    </motion.div>
  );
}


export default function App() {
  const [brothers, setBrothers] = useState(DEFAULT_BROTHERS);
  const [quotes, setQuotes] = useState(DEFAULT_QUOTES);
  const [selectedBrother, setSelectedBrother] = useState(DEFAULT_BROTHERS[0]);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!supabase) {
        setDbLoading(false);
        return;
      }
      try {
        const { data: charData, error: charError } = await supabase.from('characters').select('*').order('created_at', { ascending: true });
        const { data: quoteData, error: quoteError } = await supabase.from('quotes').select('*').order('created_at', { ascending: true });

        if (!charError && charData && charData.length > 0) {
          setBrothers(charData);
          setSelectedBrother(charData[0]);
        }
        if (!quoteError && quoteData && quoteData.length > 0) {
          setQuotes(quoteData.map(q => q.text));
        }
      } catch (err) {
        console.warn("Supabase fetch failed, using defaults:", err);
      } finally {
        setDbLoading(false);
      }
    }
    fetchData();
  }, []);

  const nextQuote = () => setQuoteIndex((prev) => (prev + 1) % quotes.length);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-stone-200 font-sans selection:bg-amber-500/30">
      {/* Hero Section */}
      <header className="relative h-[40vh] flex items-center justify-center overflow-hidden border-b border-stone-800">
        <div className="absolute inset-0 z-0 opacity-30">
          <img 
            src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=2000" 
            alt="Old books background" 
            className="w-full h-full object-cover grayscale"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a1a1a]"></div>
        </div>
        
        <div className="relative z-10 text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-serif font-bold tracking-tighter mb-4 text-stone-100"
          >
            卡拉马佐夫兄弟
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-stone-400 text-lg md:text-xl max-w-2xl mx-auto italic mb-8"
          >
            “人类灵魂的深渊，上帝与魔鬼搏斗的战场。”
          </motion.p>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            onClick={() => setShowAnimation(true)}
            className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-full font-bold flex items-center gap-2 mx-auto transition-all shadow-lg shadow-amber-900/20 group"
          >
            <Book className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            观看《宗教大法官》剧场
          </motion.button>
        </div>
      </header>

      <AnimatePresence>
        {showAnimation && (
          <GrandInquisitorAnimation onClose={() => setShowAnimation(false)} />
        )}
      </AnimatePresence>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-24">
        
        {/* Characters Section */}
        <section id="characters">
          <div className="flex items-center gap-3 mb-8">
            <Users className="text-amber-500" />
            <h2 className="text-3xl font-serif font-semibold">家族成员</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-2">
              {brothers.map((brother) => (
                <button
                  key={brother.id}
                  onClick={() => setSelectedBrother(brother)}
                  className={`w-full text-left p-4 rounded-lg transition-all flex items-center justify-between group ${
                    selectedBrother.id === brother.id 
                    ? 'bg-stone-800 border-l-4 border-amber-500 shadow-lg' 
                    : 'hover:bg-stone-800/50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{brother.icon}</span>
                    <span className={`font-medium ${selectedBrother.id === brother.id ? 'text-white' : 'text-stone-400'}`}>
                      {brother.name}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedBrother.id === brother.id ? 'translate-x-1 text-amber-500' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
              ))}
            </div>

            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedBrother.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`${selectedBrother.color} p-8 rounded-2xl shadow-2xl min-h-[300px] flex flex-col justify-center relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 p-12 opacity-10 text-9xl pointer-events-none">
                    {selectedBrother.icon}
                  </div>
                  <h3 className="text-3xl font-bold mb-2">{selectedBrother.name}</h3>
                  <p className="text-amber-300 font-medium mb-6 tracking-wide uppercase text-sm">{selectedBrother.title}</p>
                  <p className="text-lg leading-relaxed text-stone-100 max-w-xl">
                    {selectedBrother.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Brain className="text-amber-500" />
              <h2 className="text-3xl font-serif font-semibold">核心哲学</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-stone-800/50 p-6 rounded-xl border border-stone-700">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-500" />
                  大审判官 (The Grand Inquisitor)
                </h4>
                <p className="text-stone-400 text-sm leading-relaxed">
                  伊万创作的一首诗，探讨了自由的重担。审判官认为人类无法承受基督给予的自由，宁愿用自由换取面包和安全。
                </p>
              </div>
              <div className="bg-stone-800/50 p-6 rounded-xl border border-stone-700">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-500" />
                  人人都有罪 (Everyone is Guilty)
                </h4>
                <p className="text-stone-400 text-sm leading-relaxed">
                  佐西马长老提出的观点：每个人都对所有人的苦难负有责任。这种连带责任感是通往救赎的唯一路径。
                </p>
              </div>
            </div>
          </div>
          <div className="relative group cursor-pointer" onClick={nextQuote}>
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-red-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-stone-900 p-10 rounded-2xl border border-stone-800 text-center min-h-[250px] flex flex-col justify-center">
              <Quote className="w-10 h-10 text-stone-700 mx-auto mb-6" />
              <AnimatePresence mode="wait">
                <motion.p
                  key={quoteIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="text-xl md:text-2xl font-serif italic text-stone-200 leading-snug"
                >
                  {quotes[quoteIndex]}
                </motion.p>
              </AnimatePresence>
              <p className="mt-8 text-stone-500 text-sm uppercase tracking-widest">点击切换名言</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-12 border-t border-stone-800 text-center text-stone-500 text-sm pb-12">
          <div className="flex justify-center gap-6 mb-4">
            <Book className="w-5 h-5 hover:text-amber-500 transition-colors cursor-pointer" />
            <Users className="w-5 h-5 hover:text-amber-500 transition-colors cursor-pointer" />
            <Brain className="w-5 h-5 hover:text-amber-500 transition-colors cursor-pointer" />
          </div>
          <p>© 1880 - 2026 陀思妥耶夫斯基文学探索</p>
        </footer>
      </main>
    </div>
  );
}
