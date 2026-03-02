import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Sparkles, 
  Image as ImageIcon, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  RefreshCw,
  Download,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { retouchImage } from './services/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_PROMPT = "Professional studio portrait retouching, high-end skin texture preservation, remove blemishes and acne, soft fashion lighting, subtle makeup enhancement, sharp eyes, natural skin tone correction, 8k resolution, photorealistic, cinematic post-processing, CPAC Imaging Pro style.";

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [retouchedImage, setRetouchedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [smoothing, setSmoothing] = useState(50);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setOriginalImage(reader.result as string);
        setRetouchedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    multiple: false
  } as any);

  const handleRetouch = async () => {
    if (!originalImage) return;
    setIsProcessing(true);
    setError(null);
    try {
      const smoothingInstruction = smoothing > 75 
        ? "Apply intensive high-end skin smoothing for a flawless magazine look." 
        : smoothing < 25 
        ? "Apply very subtle skin smoothing, focusing primarily on blemish removal while preserving all natural pores and textures."
        : `Apply moderate skin smoothing (level ${smoothing}/100) to create a clean, professional studio finish.`;

      const finalPrompt = `${prompt} ${smoothingInstruction}`;
      const result = await retouchImage(originalImage, finalPrompt);
      setRetouchedImage(result);
    } catch (err) {
      console.error(err);
      setError("Failed to retouch image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!retouchedImage) return;
    const link = document.createElement('a');
    link.href = retouchedImage;
    link.download = 'retouched-portrait.png';
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-serif font-bold tracking-tight">Studio Retouch Pro</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">v1.0.0</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <div className="grid lg:grid-cols-[1fr_380px] gap-12">
          {/* Left Column: Image Area */}
          <div className="space-y-8">
            {!originalImage ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                {...getRootProps()}
                className={cn(
                  "aspect-[4/3] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all cursor-pointer",
                  isDragActive ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/50"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-zinc-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium">Drop your portrait here</p>
                  <p className="text-sm text-zinc-500">or click to browse files</p>
                </div>
                <p className="text-xs text-zinc-400 mt-4">Supports PNG, JPG, WEBP</p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Original */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Original</span>
                      <button 
                        onClick={() => setOriginalImage(null)}
                        className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-4"
                      >
                        Change Image
                      </button>
                    </div>
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
                      <img 
                        src={originalImage} 
                        alt="Original" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Retouched */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Retouched</span>
                      {retouchedImage && (
                        <button 
                          onClick={downloadImage}
                          className="flex items-center gap-1.5 text-xs font-medium text-zinc-900 hover:opacity-70 transition-opacity"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      )}
                    </div>
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 relative">
                      <AnimatePresence mode="wait">
                        {isProcessing ? (
                          <motion.div 
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10"
                          >
                            <Loader2 className="w-10 h-10 text-zinc-900 animate-spin mb-4" />
                            <p className="text-sm font-medium animate-pulse">Retouching skin textures...</p>
                          </motion.div>
                        ) : retouchedImage ? (
                          <motion.img 
                            key="result"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            src={retouchedImage} 
                            alt="Retouched" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300">
                            <ImageIcon className="w-12 h-12 mb-2" />
                            <p className="text-sm">Ready to process</p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Controls */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-zinc-200 p-8 space-y-8 shadow-sm">
              <div className="space-y-2">
                <h2 className="text-lg font-serif font-bold">Retouch Settings</h2>
                <p className="text-sm text-zinc-500">Fine-tune the AI instructions for the perfect studio finish.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Manual Smoothing</label>
                    <span className="text-xs font-mono font-medium text-zinc-900">{smoothing}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={smoothing}
                    onChange={(e) => setSmoothing(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 font-medium uppercase tracking-tighter">
                    <span>Natural</span>
                    <span>Balanced</span>
                    <span>Flawless</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">AI Instructions</label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-48 p-4 rounded-xl border border-zinc-200 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all resize-none leading-relaxed"
                    placeholder="Describe the retouching style..."
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setPrompt(DEFAULT_PROMPT)}
                    className="px-3 py-1.5 rounded-full bg-zinc-100 text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <div className="flex items-start gap-3 text-zinc-500">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-xs leading-relaxed">
                    Our AI preserves natural skin texture while removing temporary blemishes and optimizing lighting.
                  </p>
                </div>

                <button
                  disabled={!originalImage || isProcessing}
                  onClick={handleRetouch}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                    !originalImage || isProcessing 
                      ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" 
                      : "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]"
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Apply Studio Retouch
                    </>
                  )}
                </button>

                {error && (
                  <p className="text-xs text-red-500 text-center font-medium">{error}</p>
                )}
              </div>
            </div>

            {/* Features List */}
            <div className="px-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Included Enhancements</h3>
              <ul className="space-y-3">
                {[
                  "Texture preservation",
                  "Blemish removal",
                  "Eye sharpening",
                  "Lighting optimization",
                  "Color correction"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-zinc-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8 bg-zinc-50/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-400">© 2026 Studio Retouch Pro. Powered by Gemini AI.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
