import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import ePub, { Rendition } from 'epubjs';
import { Book, ReaderSettings, ViewMode, AiHighlight, Theme } from '../types';
import { splitSentences } from '../utils';
import PaperImperfections from './PaperImperfections';

interface ReaderViewProps {
  book: Book;
  currentChapterIndex: number;
  currentSentenceIndex: number;
  onSentenceClick: (index: number) => void;
  settings: ReaderSettings;
  viewMode: ViewMode;
  aiHighlights: AiHighlight[];
}

const ReaderView: React.FC<ReaderViewProps> = ({
  book,
  currentChapterIndex,
  currentSentenceIndex,
  onSentenceClick,
  settings,
  viewMode,
  aiHighlights
}) => {
  const chapter = book.chapters?.[currentChapterIndex];
  
  // --- Text-based Rendering Logic ---
  const sentences = useMemo(() => {
    const content = chapter?.content || '';
    if (book.fileType === 'epub') {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        // Add newlines for block elements to preserve paragraph structure
        tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, blockquote, li, br').forEach(el => {
            el.insertAdjacentHTML('afterend', '\n');
        });
        return splitSentences(tempDiv.textContent || '');
    }
    return splitSentences(content);
  }, [chapter, book.fileType]);


  const activeSentenceRef = useRef<HTMLElement>(null);
  const readerContentRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<React.ReactNode[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isTurning, setIsTurning] = useState(false);
  
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const highlightClasses = useMemo(() => {
    const classes = new Map<number, string>();
    if (aiHighlights) {
        for (const highlight of aiHighlights) {
            classes.set(highlight.sentenceIndex, `highlight-${highlight.category}`);
        }
    }
    return classes;
  }, [aiHighlights]);

  const paginateContent = useCallback(() => {
    if (!pageContainerRef.current) return;
    
    const container = pageContainerRef.current;
    const computedStyle = getComputedStyle(container);
    const containerWidth = container.clientWidth - parseFloat(computedStyle.paddingLeft) - parseFloat(computedStyle.paddingRight);
    const containerHeight = container.clientHeight - parseFloat(computedStyle.paddingTop) - parseFloat(computedStyle.paddingBottom);

    if (containerWidth <= 0 || containerHeight <= 0) return;

    const measurer = document.createElement('div');
    measurer.style.position = 'absolute';
    measurer.style.left = '-9999px';
    measurer.style.visibility = 'hidden';
    measurer.style.width = `${containerWidth}px`;
    measurer.style.height = `${containerHeight}px`;
    measurer.style.font = computedStyle.font;
    measurer.style.lineHeight = computedStyle.lineHeight;
    document.body.appendChild(measurer);

    const generatedPages: React.ReactNode[] = [];
    let currentPageNodes: React.ReactNode[] = [];

    sentences.forEach((sentence, index) => {
        const sentenceSpan = <span key={`paginator-${index}`}>{sentence}{' '}</span>;
        measurer.innerHTML += sentence + ' ';
        
        if (measurer.scrollHeight > containerHeight) {
            generatedPages.push(<>{currentPageNodes}</>);
            measurer.innerHTML = sentence + ' ';
            currentPageNodes = [sentenceSpan];
        } else {
            currentPageNodes.push(sentenceSpan);
        }
    });

    if (currentPageNodes.length > 0) {
        generatedPages.push(<>{currentPageNodes}</>);
    }

    document.body.removeChild(measurer);
    setPages(generatedPages);
    setCurrentPageIndex(0);

  }, [sentences, settings.fontSize, settings.fontFamily, settings.lineHeight]);
  
  // Debounce pagination for text files
  useEffect(() => {
    const handler = setTimeout(() => {
      if (book.fileType === 'txt' && viewMode === 'reading' && settings.mode === 'page' && settings.paperSimulation) {
        paginateContent();
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [paginateContent, book.fileType, viewMode, settings.mode, settings.paperSimulation]);

  useEffect(() => {
    const isTextMode = book.fileType === 'txt' || viewMode === 'karaoke' || viewMode === 'hybrid';
    if (isTextMode) {
      activeSentenceRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
      });
    }
  }, [currentSentenceIndex, book.fileType, viewMode]);
  
  // --- EPUB Rendering Logic ---
  const readerAreaRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const isEpubReadingMode = book.fileType === 'epub' && (viewMode === 'reading' || (viewMode === 'hybrid' && book.fileType === 'epub'));

  const epubThemes = useMemo(() => ({
    light: { body: { background: '#fdf6e3', color: '#586e75', 'line-height': `${settings.lineHeight}` } },
    dark: { body: { background: '#1f2937', color: '#d1d5db', 'line-height': `${settings.lineHeight}` } },
    sepia: { body: { background: '#f4e9db', color: '#5b4636', 'line-height': `${settings.lineHeight}` } },
    grey: { body: { background: '#374151', color: '#e5e7eb', 'line-height': `${settings.lineHeight}` } },
  }), [settings.lineHeight]);

  // Effect for INITIALIZATION and DESTRUCTION of Epub.js
  useEffect(() => {
    if (!isEpubReadingMode || !readerAreaRef.current || !book.epubData) {
      return;
    }

    const epubBook = ePub(book.epubData);
    const rendition = epubBook.renderTo(readerAreaRef.current, {
      width: "100%",
      height: "100%",
    });
    renditionRef.current = rendition;

    rendition.display(book.chapters?.[currentChapterIndex]?.href);

    return () => {
      if (renditionRef.current) {
        renditionRef.current.destroy();
        renditionRef.current = null;
      }
      if (epubBook) {
        epubBook.destroy();
      }
    };
  }, [book.epubData, isEpubReadingMode]); // Re-run only when the book itself changes

  // Effect to update rendition SETTINGS
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    
    // Register themes with up-to-date settings
    Object.entries(epubThemes).forEach(([name, theme]) => {
        rendition.themes.register(name, theme);
    });

    rendition.themes.select(settings.theme);
    rendition.themes.fontSize(`${settings.fontSize}rem`);
    const fontFamily = settings.fontFamily === 'sans' ? 'sans-serif' : (settings.fontFamily === 'dyslexic' ? 'OpenDyslexic' : 'serif');
    rendition.themes.font(fontFamily);

    const isPaperSim = viewMode === 'reading' && settings.mode === 'page' && settings.paperSimulation;
    rendition.flow(settings.mode === 'scroll' && !isPaperSim ? "scrolled-doc" : "paginated");
    rendition.spread(isPaperSim ? "auto" : "none");

  }, [settings, viewMode, epubThemes]); // Re-run when settings change

  // Effect to navigate rendition to the current chapter
  useEffect(() => {
      const rendition = renditionRef.current;
      const targetHref = book.chapters?.[currentChapterIndex]?.href;
      if (rendition && targetHref) {
          const currentLocation = rendition.currentLocation();
          if (currentLocation?.href !== targetHref) {
              rendition.display(targetHref);
          }
      }
  }, [currentChapterIndex, book.chapters]);

  const handleNextPage = useCallback(() => renditionRef.current?.next(), []);
  const handlePrevPage = useCallback(() => renditionRef.current?.prev(), []);

  // --- Main Render Logic ---

  const dynamicReaderStyle = {
    fontSize: `${settings.fontSize}rem`,
    lineHeight: settings.lineHeight,
  } as React.CSSProperties;

  const renderTextContent = (isKaraoke = false) => (
    <>
      {sentences.map((sentence, index) => {
        if (!sentence || sentence.trim() === '') return null;
        const isCurrent = index === currentSentenceIndex;
        return (
          <span
            key={index}
            ref={isCurrent ? activeSentenceRef : null}
            onClick={() => onSentenceClick(index)}
            className={`cursor-pointer transition-colors duration-300 ${isKaraoke ? '' : highlightClasses.get(index) || ''}`}
            style={isCurrent ? { 
                backgroundColor: 'var(--reader-highlight-bg)', 
                color: 'var(--reader-highlight-text)' 
            } : {}}
          >
            {sentence}{' '}
          </span>
        );
      })}
    </>
  );

  const renderTextPaperSimulationView = () => (
    <div className="book-viewport">
        <div className="book" style={{ fontFamily: `var(--font-family, 'Lora')` }}>
            <div ref={pageContainerRef} className="book-page book-page--left paper-texture">
                <div className="book-page--content">{pages[currentPageIndex] || ''}</div>
                <PaperImperfections pageElement={pageContainerRef.current} />
            </div>
            
            <div className="book-page book-page--right paper-texture">
                 <div className="book-page--content">{pages[currentPageIndex + 2] || ''}</div>
                <PaperImperfections pageElement={pageContainerRef.current}/>
            </div>

            {pages.length > currentPageIndex + 1 && (
                 <div 
                    className={`flipper ${isTurning ? 'turning' : ''}`}
                    onClick={() => { if (!isTurning && currentPageIndex + 2 < pages.length) setIsTurning(true) }}
                    onTransitionEnd={isTurning ? () => { setCurrentPageIndex(p => p + 2); setIsTurning(false); } : undefined}
                >
                    <div className="flipper__face flipper__face--front paper-texture">
                        <div className="book-page--content">{pages[currentPageIndex + 1]}</div>
                         <PaperImperfections pageElement={pageContainerRef.current}/>
                    </div>
                    <div className="flipper__face flipper__face--back paper-texture">
                        <div className="book-page--content">{pages[currentPageIndex + 2] || ''}</div>
                         <PaperImperfections pageElement={pageContainerRef.current}/>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
  
  // Handle EPUB rendering first
  if (isEpubReadingMode) {
    const isPaperSim = viewMode === 'reading' && settings.mode === 'page' && settings.paperSimulation;
    return (
      <div
        className="reader-view w-full h-full flex flex-col"
        data-theme={settings.theme}
        data-font={settings.fontFamily}
      >
        {isPaperSim ? (
          <div className="book-viewport" style={{ fontFamily: `var(--font-family, 'Lora')` }}>
            <div className="book">
              <div ref={readerAreaRef} className="w-full h-full" />
              <div className="absolute left-0 top-0 h-full w-[15%] cursor-pointer z-10" onClick={handlePrevPage} aria-label="Previous page" />
              <div className="absolute right-0 top-0 h-full w-[15%] cursor-pointer z-10" onClick={handleNextPage} aria-label="Next page" />
            </div>
          </div>
        ) : (
          <div className="reader-content w-full h-full p-0">
            <div ref={readerAreaRef} className="w-full h-full" />
          </div>
        )}
      </div>
    );
  }

  // Fallback to text-based rendering for .txt files or karaoke/hybrid modes
  const isTextPaperSim = book.fileType === 'txt' && viewMode === 'reading' && settings.mode === 'page' && settings.paperSimulation;
  const readingMode = viewMode === 'reading' ? settings.mode : viewMode;

  return (
    <div
      className="reader-view w-full h-full flex flex-col"
      data-theme={settings.theme}
      data-font={settings.fontFamily}
      style={dynamicReaderStyle}
    >
      {isTextPaperSim ? (
        renderTextPaperSimulationView()
      ) : (
        <div 
          ref={readerContentRef}
          className="reader-content w-full h-full"
        >
          {readingMode === 'karaoke' && (
             <div className="h-full flex flex-col justify-center items-center text-center p-8">
               <p className="text-2xl md:text-3xl lg:text-4xl leading-relaxed font-semibold">{renderTextContent(true)}</p>
             </div>
          )}
          {readingMode === 'hybrid' && (
              <div className="h-full overflow-y-auto p-8 text-justify">
                  {renderTextContent()}
              </div>
          )}
          {readingMode === 'scroll' && viewMode === 'reading' && (
              <div className="h-full overflow-y-auto p-8 text-justify">
                  {renderTextContent()}
              </div>
          )}
          {readingMode === 'page' && viewMode === 'reading' && !settings.paperSimulation && (
              <div className="h-full p-8 sm:p-12 md:p-16 text-justify" style={{ columnWidth: '25rem', columnGap: '4rem' }}>
                  {renderTextContent()}
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReaderView;