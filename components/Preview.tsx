
import React from 'react';

interface PreviewProps {
  codeImageUrl: string | null;
  imageUrl: string | null;
  codeScale: number;
  marginTopCm: number;
  imagePositionCm: number;
  showGrid: boolean;
}

const PAGE_HEIGHT_CM = 15;
const PAGE_WIDTH_CM = 3.5;

// Ruler sub-components
const HorizontalRuler = () => {
    const numTicks = PAGE_WIDTH_CM * 2; // every 0.5cm
    return (
        <div className="absolute left-0 right-0 h-6 -top-6 text-gray-400 dark:text-subtle-text text-[10px] font-mono select-none z-20 pointer-events-none">
            {Array.from({ length: numTicks + 1 }).map((_, i) => {
                const isMajor = i % 2 === 0;
                const value = i / 2;
                if (value === 0) return null; // Don't label 0
                return (
                    <div key={`h-${i}`} className="absolute top-0 h-full" style={{ left: `${(i / numTicks) * 100}%` }}>
                        <div className="h-full flex flex-col justify-end items-center">
                            <div className="bg-gray-400 dark:bg-subtle-text" style={{ width: '1px', height: isMajor ? '8px' : '4px' }} />
                        </div>
                        {isMajor && (
                            <span className="absolute -bottom-3.5" style={{ transform: 'translateX(-50%)' }}>{value}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const VerticalRuler = () => {
    const numTicks = PAGE_HEIGHT_CM * 2; // every 0.5cm
    return (
        <div className="absolute top-0 bottom-0 w-6 -left-6 text-gray-400 dark:text-subtle-text text-[10px] font-mono select-none z-20 pointer-events-none">
            {Array.from({ length: numTicks + 1 }).map((_, i) => {
                const isMajor = i % 2 === 0;
                const value = i / 2;
                if (value === 0) return null; // Don't label 0
                return (
                    <div key={`v-${i}`} className="absolute left-0 w-full" style={{ top: `${(i / numTicks) * 100}%` }}>
                        <div className="w-full flex justify-end items-center">
                            <div className="bg-gray-400 dark:bg-subtle-text" style={{ height: '1px', width: isMajor ? '8px' : '4px' }} />
                        </div>
                        {isMajor && (
                            <span className="absolute -left-4" style={{ transform: 'translateY(-50%)' }}>{value}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const Preview: React.FC<PreviewProps> = ({ codeImageUrl, imageUrl, codeScale, marginTopCm, imagePositionCm, showGrid }) => {
  const marginTopPercent = (marginTopCm / PAGE_HEIGHT_CM) * 100;
  const imagePositionPercent = (imagePositionCm / PAGE_HEIGHT_CM) * 100;

  return (
    <div className="w-full bg-white dark:bg-dark-card rounded-2xl shadow-lg p-4 flex justify-center items-center h-full dark:border dark:border-white/10 overflow-hidden">
      <div className="relative w-full h-full flex justify-center items-center">
        {/* Sizing container that also serves as a parent for the rulers */}
        <div
          className="relative"
          style={{
            height: '100%',
            maxHeight: '100%',
            maxWidth: '100%',
            aspectRatio: `${PAGE_WIDTH_CM} / ${PAGE_HEIGHT_CM}`,
            marginTop: showGrid ? '1.5rem' : '0',
            marginLeft: showGrid ? '1.5rem' : '0',
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {showGrid && (
            <>
              <HorizontalRuler />
              <VerticalRuler />
            </>
          )}

          {/* Inner container for the actual label preview with overflow hidden */}
          <div
            className="relative bg-white shadow-xl dark:shadow-2xl dark:shadow-black/50 h-full w-full"
            style={{
              overflow: 'hidden',
            }}
          >
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  backgroundSize: `calc(100% / ${PAGE_WIDTH_CM * 2}) calc(100% / ${PAGE_HEIGHT_CM * 2})`,
                  backgroundImage: `
                    linear-gradient(to right, rgba(128, 128, 128, 0.2) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(128, 128, 128, 0.2) 1px, transparent 1px)
                  `,
                }}
                aria-hidden="true"
              />
            )}

            {codeImageUrl ? (
              <img
                src={codeImageUrl}
                alt="Code Preview"
                className="absolute left-1/2"
                style={{
                  top: `${marginTopPercent}%`,
                  transform: `translateX(-50%) scale(${codeScale})`,
                  transformOrigin: 'top center',
                  width: '95%',
                }}
              />
            ) : (
              <div
                className="absolute top-0 left-1/2 w-[95%] h-[30%] bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded"
                style={{
                  top: `${marginTopPercent}%`,
                  transform: `translateX(-50%) scale(${codeScale})`,
                  transformOrigin: 'top center',
                }}
              >
                <span className="text-gray-400 dark:text-gray-500 text-xs font-mono text-center px-1">CODE PAGE PREVIEW</span>
              </div>
            )}

            {imageUrl && (
              <img
                src={imageUrl}
                alt="Image Preview"
                className="absolute left-1/2"
                style={{
                  top: `${imagePositionPercent}%`,
                  transform: 'translateX(-50%)',
                  maxWidth: '90%',
                  maxHeight: '40%',
                }}
              />
            )}

            <div
              className="absolute w-full h-px bg-red-500/50 pointer-events-none"
              style={{ top: '50%', transform: 'translateY(-0.5px)' }}
              aria-hidden="true"
            ></div>

            <div className="absolute inset-0 border border-gray-200 dark:border-gray-600 rounded-sm pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
