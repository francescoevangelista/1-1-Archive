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

  // Funzione per formattare il testo: "VERIFY" -> "Verify"
  const formatTitle = (str: string) => {
      if (str === 'UPLOAD') return 'Verify';
      const lower = str.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white/95 dark:bg-black/95 backdrop-blur-md dark:text-white flex flex-col p-4 md:p-8 overflow-y-auto pointer-events-auto transition-colors animate-fade-in">
      <div className="flex justify-between items-center mb-12 md:mb-16 pt-2">
        <h2 className="text-4xl md:text-6xl suisse-medium tracking-tighter">{formatTitle(section)}</h2>
        <button 
          onClick={onClose}
          className="text-xs md:text-sm suisse-medium hover:underline"
        >
          Close
        </button>
      </div>

      <div className="w-full flex-1 flex flex-col">
        {section === AppSection.INFO && (
          <div className="max-w-4xl">
            <div className="text-xl md:text-3xl leading-normal space-y-8 suisse-regular">
              <p>
                Mai nella storia sono state prodotte tante immagini.<br/>
                Mai le immagini sono state così simili tra loro.
              </p>
              <p>
                Questo archivio open source raccoglie 88 fotografie estratte dai social media, 
                divise in quattro categorie: Ambienti, Still Life, Figure, Graphic.
              </p>
              <p>
                Sovrapposte su fogli di acetato trasparente, le immagini rivelano la loro 
                natura intercambiabile, convergendo in una macchia indistinta.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-20 mt-auto">
              <div>
                <h4 className="text-[10px] mb-4 tracking-widest suisse-medium">Crediti</h4>
                <div className="space-y-1 text-sm leading-tight">
                  <p>Progetto di tesi di Francesco Evangelista</p>
                  <p>NABA Nuova Accademia di Belle Arti, Roma</p>
                  <p>Marzo 2026</p>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] mb-4 tracking-widest suisse-medium">Supervisione</h4>
                <div className="space-y-1 text-sm leading-tight">
                  <p>Relatore: Prof. Riccardo Casinelli</p>
                  <p>Correlatrice: Prof.ssa Martina Tariciotti</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {section === AppSection.ARCHIVIO && (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-0">
              {Array.from({ length: 88 }).map((_, i) => (
                <div 
                  key={i} 
                  onClick={() => setZoomedImage(`assets/img-${i + 1}.png`)}
                  className="aspect-square relative cursor-zoom-in group overflow-hidden outline outline-1 outline-transparent hover:outline-black dark:hover:outline-white hover:z-10 transition-all"
                >
                  <img 
                    src={`assets/img-${i + 1}.png`} 
                    alt={`Index ${i + 1}`}
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${i}/400/400` }}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" 
                  />
                  <span className="absolute bottom-0 right-0 text-[8px] suisse-mono bg-black text-white dark:bg-white dark:text-black px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
            {zoomedImage && (
              <div 
                className="fixed inset-0 z-[110] bg-white/98 dark:bg-black/98 flex items-center justify-center p-4 cursor-zoom-out"
                onClick={() => setZoomedImage(null)}
              >
                <img 
                  src={zoomedImage} 
                  alt="Zoomed" 
                  className="max-w-full max-h-full object-contain drop-shadow-2xl" 
                />
              </div>
            )}
          </>
        )}

        {(section === AppSection.EXPAND || (section === AppSection.UPLOAD && !verificationImage)) && (
          <div 
            className={`flex-1 w-full border-2 border-dashed transition-all cursor-pointer group flex flex-col items-center justify-center gap-4
              ${dragActive 
                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' 
                : 'border-black/30 dark:border-white/30 hover:border-black dark:hover:border-white hover:bg-gray-50 dark:hover:bg-zinc-900'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleFileClick}
          >
            <div className="text-4xl suisse-medium mb-2 group-hover:scale-110 transition-transform">[ + ]</div>
            <div className="text-center space-y-1">
              <h3 className="text-2xl md:text-3xl suisse-medium">
                {section === AppSection.EXPAND ? 'Expand archive' : 'Verify image'}
              </h3>
              <p className="text-sm suisse-regular opacity-60">
                Drag & Drop or Click to upload
              </p>
            </div>
          </div>
        )}

        {section === AppSection.UPLOAD && verificationImage && (
          <div className="flex flex-col gap-12 animate-fade-in flex-1">
            <div className="flex flex-col gap-4 items-start">
               <span className="text-[10px] tracking-widest suisse-medium">Input source</span>
               <img 
                src={verificationImage} 
                alt="Uploaded"
                className="w-32 h-32 md:w-48 md:h-48 object-cover border border-black dark:border-white" 
              />
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-end mb-6">
                <span className="text-[10px] tracking-widest suisse-medium">Database matches</span>
                <span className="text-[10px] suisse-mono">10 Results found</span>
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
                {Array.from({ length: 10 }).map((_, i) => {
                  const percent = 99 - (i * 2); 
                  const matchId = i + 1; 
                  
                  return (
                    <div key={i} className="relative group cursor-pointer aspect-square bg-gray-100 dark:bg-zinc-800 outline outline-1 outline-transparent hover:outline-black dark:hover:outline-white transition-all">
                      <img 
                        src={`assets/match-${matchId}.jpg`}
                        alt={`Match ${matchId}`}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${matchId + 500}/400/400`;
                        }} 
                      />
                      <div className="absolute top-0 left-0 bg-black text-white dark:bg-white dark:text-black text-[9px] px-1.5 py-0.5 suisse-mono leading-none">
                        {percent}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={() => setVerificationImage(null)}
                className="suisse-medium text-xs tracking-wider hover:underline"
              >
                Scan new image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overlay;