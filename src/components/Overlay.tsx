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

  const title = section.charAt(0) + section.slice(1).toLowerCase();

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-black dark:text-white flex flex-col p-5 md:p-10 overflow-y-auto pointer-events-auto transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 md:mb-10 gap-4">
        <h2 className="text-4xl md:text-6xl suisse-bold tracking-tighter">{title}</h2>
        <button 
          onClick={onClose}
          className="text-xs border border-black dark:border-white px-5 py-2 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all suisse-regular"
        >
          Chiudi [Esc]
        </button>
      </div>

      {/* Content */}
      <div className="w-full flex-1 suisse-regular">
        
        {/* INFO */}
        {section === AppSection.INFO && (
          <div className="space-y-8 max-w-4xl">
            <div className="text-xl md:text-2xl leading-relaxed space-y-6">
              <p>
                Mai nella storia sono state prodotte tante immagini.<br/>
                Mai le immagini sono state così simili tra loro.
              </p>
              <p>
                Questo archivio raccoglie 88 fotografie estratte dai social media, 
                divise in quattro categorie: Ambienti, Still Life, Figure, Graphic.
              </p>
              <p>
                Sovrapposte su fogli di acetato trasparente, rivelano la loro 
                natura intercambiabile: convergono in una macchia indistinta.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-black/10 dark:border-white/10">
              <div>
                <h4 className="text-[10px] mb-3 opacity-40 uppercase tracking-widest">Crediti</h4>
                <p className="text-base">Progetto di tesi di Francesco Evangelista</p>
                <p className="text-base">NABA Nuova Accademia di Belle Arti, Roma</p>
                <p className="text-base">Diploma in Graphic Design e Art Direction</p>
                <p className="text-base">Marzo 2026</p>
              </div>
              <div>
                <h4 className="text-[10px] mb-3 opacity-40 uppercase tracking-widest">Supervisione</h4>
                <p className="text-base">Relatore: Prof. Riccardo Casinelli</p>
                <p className="text-base">Correlatrice: Prof.ssa Martina Tariciotti</p>
              </div>
            </div>
          </div>
        )}

        {/* ARCHIVIO */}
        {section === AppSection.ARCHIVIO && (
          <>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-1">
              {Array.from({ length: 88 }).map((_, i) => (
                <div 
                  key={i} 
                  onClick={() => setZoomedImage(`assets/img-${i + 1}.png`)}
                  className="aspect-square bg-gray-100 dark:bg-zinc-900 overflow-hidden group relative cursor-zoom-in"
                >
                  <img 
                    src={`assets/img-${i + 1}.png`} 
                    alt={`Index ${i + 1}`}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${i}/400/400` }}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" 
                  />
                  <span className="absolute bottom-1 right-1 text-[8px] bg-white/80 dark:bg-black/80 px-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Zoomed view */}
            {zoomedImage && (
              <div 
                className="fixed inset-0 z-[110] bg-white dark:bg-black flex items-center justify-center p-8 cursor-zoom-out"
                onClick={() => setZoomedImage(null)}
              >
                <img 
                  src={zoomedImage} 
                  alt="Zoomed" 
                  className="max-w-full max-h-full object-contain border border-black dark:border-white" 
                />
                <span className="absolute top-5 right-5 text-xs opacity-50">Click per chiudere</span>
              </div>
            )}
          </>
        )}

        {/* EXPAND */}
        {section === AppSection.EXPAND && (
          <div 
            className={`w-full h-[50vh] border-2 border-dashed flex flex-col items-center justify-center gap-6 transition-all cursor-pointer
              ${dragActive 
                ? 'bg-black text-white border-white' 
                : 'bg-gray-50 dark:bg-zinc-900 text-black dark:text-white border-black dark:border-white'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleFileClick}
          >
            <div className="text-5xl md:text-7xl suisse-bold">Expand</div>
            <p className="text-lg text-center px-4">
              Trascina un file per aumentare la capacità dell'archivio
            </p>
            <p className="text-[10px] tracking-widest opacity-40 uppercase">
              Ogni upload aggiunge +1 al limite
            </p>
          </div>
        )}

        {/* UPLOAD / VERIFY */}
        {section === AppSection.UPLOAD && (
          <div className="w-full">
            {!verificationImage ? (
              <div 
                className={`w-full h-[50vh] border-2 border-dashed flex flex-col items-center justify-center gap-6 transition-all cursor-pointer
                  ${dragActive 
                    ? 'bg-black text-white border-white' 
                    : 'bg-gray-50 dark:bg-zinc-900 text-black dark:text-white border-black dark:border-white'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleFileClick}
              >
                <div className="text-5xl md:text-7xl suisse-bold">Verify</div>
                <p className="text-lg text-center px-4">
                  Carica un'immagine per verificare la corrispondenza
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] opacity-50 uppercase">File caricato</span>
                    <img 
                      src={verificationImage} 
                      alt="Uploaded"
                      className="w-full aspect-square object-cover border border-black dark:border-white" 
                    />
                  </div>
                  <div className="md:col-span-3 grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex flex-col gap-2" style={{ opacity: 1 - n * 0.25 }}>
                        <span className="text-[10px] opacity-50 uppercase">Match #{n} {100 - n * 15}%</span>
                        <img 
                          src={`https://picsum.photos/seed/match${n}/400/400`}
                          alt={`Match ${n}`}
                          className="w-full aspect-square object-cover grayscale border border-black dark:border-white" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => setVerificationImage(null)}
                  className="self-start border border-black dark:border-white px-6 py-3 text-xs hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all uppercase"
                >
                  Nuova verifica
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Overlay;
