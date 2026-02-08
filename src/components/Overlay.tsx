import React, { useState, useEffect } from 'react';
import { AppSection } from '../types';

interface OverlayProps {
  section: AppSection;
  onClose: () => void;
  onFileUpload: (file: File) => void;
}

const Overlay: React.FC<OverlayProps> = ({ section, onClose, onFileUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [verificationImage, setVerificationImage] = useState<string | null>(null);

  useEffect(() => {
    const handleClose = () => setZoomedImage(null);
    window.addEventListener('close-zoomed-view', handleClose);
    return () => window.removeEventListener('close-zoomed-view', handleClose);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (section === AppSection.UPLOAD) {
        setVerificationImage(URL.createObjectURL(file));
      } else {
        onFileUpload(file);
      }
    }
  };

  const handleFileClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        if (section === AppSection.UPLOAD) {
          setVerificationImage(URL.createObjectURL(file));
        } else {
          onFileUpload(file);
        }
      }
    };
    input.click();
  };

  const title = section === AppSection.UPLOAD ? 'Verify' : (section.charAt(0) + section.slice(1).toLowerCase());

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-black dark:text-white flex flex-col p-4 md:p-8 overflow-y-auto pointer-events-auto transition-colors animate-fade-in">
      {/* HEADER OVERLAY */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-black/10 dark:border-white/10">
        <h2 className="text-3xl md:text-5xl suisse-medium tracking-tight">{title}</h2>
        <button 
          onClick={onClose}
          className="text-[10px] md:text-xs border border-black dark:border-white px-4 py-2 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all uppercase tracking-wider"
        >
          Close
        </button>
      </div>

      <div className="w-full flex-1">
        {/* INFO SECTION */}
        {section === AppSection.INFO && (
          <div className="max-w-3xl mx-auto py-8">
            <div className="text-xl md:text-3xl leading-snug space-y-8 font-light">
              <p>
                Mai nella storia sono state prodotte tante immagini.<br/>
                Mai le immagini sono state così simili tra loro.
              </p>
              <p className="opacity-70">
                Questo archivio raccoglie 88 fotografie estratte dai social media, 
                divise in quattro categorie: Ambienti, Still Life, Figure, Graphic.
              </p>
              <p className="opacity-70">
                Sovrapposte su fogli di acetato trasparente, rivelano la loro 
                natura intercambiabile: convergono in una macchia indistinta.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-16 mt-8 border-t border-black/10 dark:border-white/10">
              <div>
                <h4 className="text-[10px] mb-4 opacity-40 uppercase tracking-widest">Crediti</h4>
                <div className="space-y-1 text-sm">
                  <p>Progetto di tesi di Francesco Evangelista</p>
                  <p>NABA Nuova Accademia di Belle Arti, Roma</p>
                  <p>Diploma in Graphic Design e Art Direction</p>
                  <p>Marzo 2026</p>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] mb-4 opacity-40 uppercase tracking-widest">Supervisione</h4>
                <div className="space-y-1 text-sm">
                  <p>Relatore: Prof. Riccardo Casinelli</p>
                  <p>Correlatrice: Prof.ssa Martina Tariciotti</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ARCHIVIO GRID */}
        {section === AppSection.ARCHIVIO && (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-px bg-gray-200 dark:bg-zinc-800 border border-black/10 dark:border-white/10">
              {Array.from({ length: 88 }).map((_, i) => (
                <div 
                  key={i} 
                  onClick={() => setZoomedImage(`assets/img-${i + 1}.png`)}
                  className="aspect-square bg-white dark:bg-black relative cursor-zoom-in group overflow-hidden"
                >
                  <img 
                    src={`assets/img-${i + 1}.png`} 
                    alt={`Index ${i + 1}`}
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${i}/400/400` }}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300 opacity-90 group-hover:opacity-100 scale-100 group-hover:scale-105" 
                  />
                  <span className="absolute bottom-1 right-1 text-[8px] font-mono bg-white/90 dark:bg-black/80 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
            {zoomedImage && (
              <div 
                className="fixed inset-0 z-[110] bg-white/95 dark:bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 cursor-zoom-out animate-fade-in"
                onClick={() => setZoomedImage(null)}
              >
                <img 
                  src={zoomedImage} 
                  alt="Zoomed" 
                  className="max-w-full max-h-full object-contain shadow-2xl" 
                />
              </div>
            )}
          </>
        )}

        {/* EXPAND (UPLOAD) */}
        {section === AppSection.EXPAND && (
          <div 
            className={`w-full h-[60vh] border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-6 transition-all cursor-pointer group
              ${dragActive 
                ? 'bg-black text-white border-white scale-[0.99]' 
                : 'bg-gray-50 dark:bg-zinc-900/50 text-black dark:text-white border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleFileClick}
          >
            <div className="w-16 h-16 rounded-full border border-current flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <span className="text-3xl font-light">+</span>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl md:text-4xl suisse-medium">Expand Archive</h3>
              <p className="text-sm md:text-base opacity-60 px-6">
                Drag & Drop or Click to upload an image
              </p>
            </div>
          </div>
        )}

        {/* VERIFY SECTION */}
        {section === AppSection.UPLOAD && (
          <div className="w-full pb-10">
            {!verificationImage ? (
              <div 
                className={`w-full h-[60vh] border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-6 transition-all cursor-pointer group
                  ${dragActive 
                    ? 'bg-black text-white border-white scale-[0.99]' 
                    : 'bg-gray-50 dark:bg-zinc-900/50 text-black dark:text-white border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleFileClick}
              >
                <div className="w-16 h-16 rounded-full border border-current flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl md:text-4xl suisse-medium">Verify Image</h3>
                  <p className="text-sm md:text-base opacity-60 px-6">
                    Check if an image exists in the dataset
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-10 animate-fade-in">
                {/* INPUT SECTION */}
                <div className="flex flex-col items-center md:items-start gap-4">
                  <span className="text-[10px] opacity-50 uppercase tracking-widest border-b border-current pb-1">Input Source</span>
                  <div className="w-48 h-48 md:w-64 md:h-64 p-2 border border-black dark:border-white bg-white dark:bg-black">
                     <img 
                      src={verificationImage} 
                      alt="Uploaded"
                      className="w-full h-full object-contain" 
                    />
                  </div>
                </div>

                {/* RESULTS SECTION */}
                <div>
                  <div className="flex justify-between items-end mb-6 border-b border-black/10 dark:border-white/10 pb-2">
                    <span className="text-[10px] opacity-50 uppercase tracking-widest">Similarity Results</span>
                    <span className="text-[10px] opacity-50">10 Matches Found</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const percent = 99 - (i * (Math.floor(Math.random() * 5) + 1)); 
                      return (
                        <div key={i} className="flex flex-col gap-2 group cursor-pointer">
                          <div className="aspect-square overflow-hidden border border-black/20 dark:border-white/20 relative bg-gray-100 dark:bg-zinc-800">
                            <img 
                              src={`assets/img-${Math.floor(Math.random() * 88) + 1}.png`}
                              alt={`Match ${i + 1}`}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${i + 100}/400/400`;
                              }} 
                            />
                            <div className="absolute top-0 right-0 bg-black text-white dark:bg-white dark:text-black text-[10px] px-1.5 py-0.5 font-mono">
                              {percent}%
                            </div>
                          </div>
                          <div className="flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] uppercase tracking-wider font-mono">
                              ID_{String(Math.floor(Math.random() * 88) + 1).padStart(3, '0')}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider font-mono">
                               {['AMB', 'STL', 'FIG', 'GRA'][Math.floor(Math.random() * 4)]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-center md:justify-start pt-8">
                  <button 
                    onClick={() => setVerificationImage(null)}
                    className="border border-black dark:border-white px-8 py-3 text-xs hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all uppercase tracking-widest"
                  >
                    Scan New Image
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Overlay;