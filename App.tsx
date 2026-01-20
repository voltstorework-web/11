
import React, { useState, useCallback, useEffect, useRef } from 'react';
import FileUpload from './components/FileUpload';
import SliderControl from './components/SliderControl';
import Preview from './components/Preview';
import { renderCroppedPdfPagesToDataUrls, generateLabelsPdf } from './services/pdfUtils';
import Icon from './components/Icon';
import type { GeneratePdfOptions } from './types';

const App: React.FC = () => {
    const [codesPdf, setCodesPdf] = useState<File | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [codePageImages, setCodePageImages] = useState<string[]>([]);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageType, setImageType] = useState<'JPEG' | 'PNG' | 'WEBP'>('PNG');

    // Layout State
    const [codeScale, setCodeScale] = useState(1.5);
    const [marginTopCm, setMarginTopCm] = useState(1.0);
    const [imagePositionCm, setImagePositionCm] = useState(7.5);

    // New Crop State
    const [cropWidthPercent, setCropWidthPercent] = useState(24);
    const [cropHeightPercent, setCropHeightPercent] = useState(40);

    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showGrid, setShowGrid] = useState(true);

    const controlsPanelRef = useRef<HTMLDivElement>(null);
    const [controlsHeight, setControlsHeight] = useState<number | null>(null);

    const isReadyToGenerate = !!codesPdf && !!imageUrl;

    useEffect(() => {
        const controlsEl = controlsPanelRef.current;
        if (!controlsEl) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                setControlsHeight(entries[0].contentRect.height);
            }
        });
        resizeObserver.observe(controlsEl);
        
        // Set initial height
        setControlsHeight(controlsEl.offsetHeight);

        return () => resizeObserver.disconnect();
    }, []);

    const handlePdfSelect = useCallback((file: File) => {
        setCodesPdf(file);
        setCodePageImages([]); // Clear previous results
    }, []);
    
    // Effect to re-process PDF for preview when file or crop settings change
    useEffect(() => {
        if (!codesPdf) {
            return;
        }

        const processPdf = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const cropOptions = { widthPercent: cropWidthPercent, heightPercent: cropHeightPercent };
                const extractedImages = await renderCroppedPdfPagesToDataUrls(codesPdf, cropOptions);
                setCodePageImages(extractedImages);
                if (extractedImages.length === 0) {
                    setError("No pages could be rendered from the PDF.");
                }
            } catch (e) {
                console.error(e);
                setError("Failed to process PDF. Please check the file and try again.");
                setCodePageImages([]);
                setCodesPdf(null);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(processPdf, 300); // Debounce to avoid rapid updates while sliding
        return () => clearTimeout(timeoutId);

    }, [codesPdf, cropWidthPercent, cropHeightPercent]);


    const handleImageSelect = useCallback((file: File) => {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        if (file.type === 'image/jpeg') setImageType('JPEG');
        else if (file.type === 'image/webp') setImageType('WEBP');
        else setImageType('PNG');

    }, []);

    const handleGeneratePdf = useCallback(async () => {
        if (!isReadyToGenerate || !imageUrl || !codesPdf) {
            setError("Please upload both a codes PDF and an image.");
            return;
        }
        setIsGenerating(true);
        setError(null);
        try {
            const options: GeneratePdfOptions = {
                imageDataUrl: imageUrl,
                imageType,
                codeScale,
                marginTopCm,
                imagePositionCm,
                cropWidthPercent,
                cropHeightPercent
            };
            await generateLabelsPdf(options, codesPdf);
        } catch (e) {
            console.error(e);
            setError("An error occurred while generating the PDF.");
        } finally {
            setIsGenerating(false);
        }
    }, [isReadyToGenerate, codesPdf, imageUrl, imageType, codeScale, marginTopCm, imagePositionCm, cropWidthPercent, cropHeightPercent]);


    return (
        <div className="min-h-screen text-gray-800 dark:text-light-text flex flex-col">
            <header className="py-4 px-8 text-center sticky top-0 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-sm z-10 border-b border-gray-200 dark:border-white/10">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-light-text tracking-tight">
                    Tai Lung <span className="text-brand">Label Generator</span>
                </h1>
                <p className="text-sm text-gray-500 dark:text-subtle-text mt-1">Create custom labels from your codes and images.</p>
            </header>

            <main className="flex-grow container mx-auto p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                    {/* Controls Panel */}
                    <div ref={controlsPanelRef} className="lg:col-span-1 bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg space-y-6 self-start dark:border dark:border-white/10">
                        <div className="space-y-2">
                             <h2 className="text-xl font-semibold text-gray-900 dark:text-light-text">1. Upload Files</h2>
                             <p className="text-sm text-gray-500 dark:text-subtle-text">Provide a PDF with codes and an image for the label.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FileUpload
                                onFileSelect={handlePdfSelect}
                                acceptedTypes=".pdf"
                                label="Codes PDF"
                                iconName="pdf"
                                file={codesPdf}
                            />
                            <FileUpload
                                onFileSelect={handleImageSelect}
                                acceptedTypes="image/png, image/jpeg, image/webp"
                                label="Photo"
                                iconName="image"
                                file={imageFile}
                            />
                        </div>
                         {isLoading && (
                            <div className="flex items-center justify-center text-sm text-gray-500 dark:text-subtle-text">
                                <Icon name="spinner" className="w-4 h-4 mr-2" />
                                Processing PDF for preview...
                            </div>
                        )}
                        {codePageImages.length > 0 && !isLoading && (
                            <div className="text-sm text-green-600 dark:text-green-400 text-center">
                                Successfully processed {codePageImages.length} page(s).
                            </div>
                        )}

                        <hr className="border-gray-200 dark:border-white/10" />
                        
                        <div className="space-y-2">
                             <h2 className="text-xl font-semibold text-gray-900 dark:text-light-text">2. Adjust Layout</h2>
                             <p className="text-sm text-gray-500 dark:text-subtle-text">Fine-tune the crop, placement, and size.</p>
                        </div>
                        <div className="space-y-4">
                             <div className="flex items-center justify-between pb-2">
                                <label htmlFor="show-grid" className="text-sm font-medium text-gray-700 dark:text-light-text cursor-pointer select-none">Show Grid & Rulers</label>
                                <button
                                    id="show-grid"
                                    role="switch"
                                    aria-checked={showGrid}
                                    onClick={() => setShowGrid(!showGrid)}
                                    className={`${showGrid ? 'bg-brand' : 'bg-gray-200 dark:bg-white/10'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-dark-card`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`${showGrid ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                    />
                                </button>
                            </div>
                             <SliderControl label="Crop Width" value={cropWidthPercent} onChange={setCropWidthPercent} min={10} max={100} step={1} unit="%" />
                             <SliderControl label="Crop Height" value={cropHeightPercent} onChange={setCropHeightPercent} min={10} max={100} step={1} unit="%" />
                             <hr className="border-gray-200 dark:border-white/10 border-dashed" />
                             <SliderControl label="Code Scale" value={codeScale} onChange={setCodeScale} min={0.5} max={1.5} step={0.05} unit="x" />
                             <SliderControl label="Margin Top" value={marginTopCm} onChange={setMarginTopCm} min={0.5} max={5} step={0.1} unit="cm" />
                             <SliderControl label="Image Position" value={imagePositionCm} onChange={setImagePositionCm} min={2} max={13} step={0.1} unit="cm" />
                        </div>
                        
                        <hr className="border-gray-200 dark:border-white/10" />

                        <div className="space-y-2">
                             <h2 className="text-xl font-semibold text-gray-900 dark:text-light-text">3. Generate</h2>
                             <p className="text-sm text-gray-500 dark:text-subtle-text">Once you're ready, generate and download your PDF.</p>
                        </div>
                        <button
                            onClick={handleGeneratePdf}
                            disabled={!isReadyToGenerate || isGenerating}
                            className="w-full bg-gradient-to-br from-brand to-brand-dark disabled:opacity-50 disabled:cursor-not-allowed text-light-text font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center hover:shadow-glow"
                        >
                            {isGenerating ? <Icon name="spinner" className="w-5 h-5 mr-2"/> : null}
                            {isGenerating ? 'Generating...' : 'Generate PDF'}
                        </button>
                        {error && <p className="text-sm text-red-500 text-center mt-2">{error}</p>}
                    </div>

                    {/* Preview Panel */}
                    <div 
                        className="lg:col-span-2 min-h-[500px] lg:sticky lg:top-24"
                        style={{ height: controlsHeight ? `${controlsHeight}px` : 'auto' }}
                    >
                       <Preview
                            codeImageUrl={codePageImages.length > 0 ? codePageImages[0] : null}
                            imageUrl={imageUrl}
                            codeScale={codeScale}
                            marginTopCm={marginTopCm}
                            imagePositionCm={imagePositionCm}
                            showGrid={showGrid}
                        />
                    </div>
                </div>
            </main>
            
            <footer className="text-center p-4 text-xs text-gray-500 dark:text-subtle-text">
                Designed by Mohamed Hassan
            </footer>
        </div>
    );
};

export default App;
