
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Chapter, ReaderSettings, Annotation } from '../types';
import { splitSentences } from '../utils';
import { ChevronLeftIcon, ChevronRightIcon, MessageSquareIcon, PaletteIcon } from './Icons';

interface ReaderViewProps {
  chapter: Chapter;
  currentSentenceIndex: number;
  onSentenceClick: (index: number) => void;
  settings: ReaderSettings;
  actions?: React.ReactNode;
  headerInfo?: React.ReactNode;
  jumpRequest?: { type: 'page' | 'percent'; value: number; id: number } | null;
  onPaginationUpdate?: (info: { currentPage: number; totalPages: number }) => void;
  annotations: Annotation[];
  onSentenceAction: (index: number, target: HTMLElement) => void;
}

const ReaderView: React.FC<ReaderViewProps> = ({
  chapter,
  currentSentenceIndex,
  onSentenceClick,
  settings,
  actions,
  headerInfo,
  jumpRequest,
  onPaginationUpdate,
  annotations,
  onSentenceAction,
}) => {
  const sentences = useMemo(() => splitSentences(chapter.content), [chapter.content]);
  const activeSentenceRef = useRef<HTMLElement>(null);
  const readerContentRef = useRef<HTMLDivElement>(null);
  const paginatedContentRef = useRef<HTMLDivElement>(null);

  const [pagination, setPagination] = useState({ currentPage: 0, totalPages: 0, sentenceToPageMap: new Map<number, number>() });
  const [isHovering, setIsHovering] = useState(false);
  const pageTurnBehavior = settings.pageTurnAnimation === 'scroll' ? 'auto' : 'smooth';

  const calculatePages = useCallback(() => {
    const container = paginatedContentRef.current;
    if (!container || settings.mode !== 'page' || container.clientWidth === 0) {
      if (pagination.totalPages > 0) setPagination(p => ({ ...p, totalPages: 0}));
      return;
    };

    const totalPages = Math.max(1, Math.round(container.scrollWidth / container.clientWidth));
    const newSentenceToPageMap = new Map<number, number>();

    const sentenceElements = container.querySelectorAll('span[data-sentence-index]');
    sentenceElements.forEach(el => {
      const sentenceIndex = parseInt(el.getAttribute('data-sentence-index')!, 10);
      const sentencePage = Math.floor((el as HTMLElement).offsetLeft / container.clientWidth);
      newSentenceToPageMap.set(sentenceIndex, sentencePage);
    });
    
    // Prevent infinite loops by checking for actual changes
    if (totalPages !== pagination.totalPages || newSentenceToPageMap.size !== pagination.sentenceToPageMap.size) {
        setPagination(p => ({ ...p, totalPages, sentenceToPageMap: newSentenceToPageMap }));
    }
  }, [settings.mode, pagination.totalPages, pagination.sentenceToPageMap]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => calculatePages(), 100);
    const observer = new ResizeObserver(() => calculatePages());
    if (readerContentRef.current) observer.observe(readerContentRef.current);

    return () => {
      clearTimeout(debounceTimeout);
      observer.disconnect();
    };
  }, [calculatePages, chapter.content, settings]);
  
  useEffect(() => {
    if (onPaginationUpdate) {
        onPaginationUpdate({ currentPage: pagination.currentPage, totalPages: pagination.totalPages });
    }
  }, [pagination.currentPage, pagination.totalPages, onPaginationUpdate]);

  useEffect(() => {
    if (settings.mode === 'page') {
      const targetPage = pagination.sentenceToPageMap.get(currentSentenceIndex);
      if (targetPage !== undefined && targetPage !== pagination.currentPage) {
        paginatedContentRef.current?.scrollTo({ left: targetPage * paginatedContentRef.current.clientWidth, behavior: pageTurnBehavior });
      }
    } else if (settings.mode === 'scroll' && settings.autoScroll) {
      activeSentenceRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: settings.autoScrollAlignment === 'top' ? 'start' : 'center' 
      });
    }
  }, [currentSentenceIndex, settings.mode, settings.autoScroll, settings.autoScrollAlignment, pagination.sentenceToPageMap, pagination.currentPage, pageTurnBehavior]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (settings.mode !== 'page') return;
    const container = e.currentTarget;
    const newCurrentPage = Math.round(container.scrollLeft / container.clientWidth);
    if (newCurrentPage !== pagination.currentPage) {
      setPagination(p => ({...p, currentPage: newCurrentPage}));
    }
  };
  
  const goToPage = useCallback((page: number) => {
    const container = paginatedContentRef.current;
    if (!container) return;
    const newPage = Math.max(0, Math.min(page, pagination.totalPages - 1));
    container.scrollTo({ left: newPage * container.clientWidth, behavior: pageTurnBehavior });
  }, [pagination.totalPages, pageTurnBehavior]);

  useEffect(() => {
    if (!jumpRequest) return;
    if (jumpRequest.type === 'page' && settings.mode === 'page') {
      goToPage(jumpRequest.value);
    } else if (jumpRequest.type === 'percent' && settings.mode === 'scroll') {
      const container = readerContentRef.current;
      if (container) {
        const clampedValue = Math.max(0, Math.min(100, jumpRequest.value));
        const targetScroll = container.scrollHeight * (clampedValue / 100);
        container.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    }
  }, [jumpRequest, settings.mode, goToPage]);

  const dynamicReaderStyle = {
    fontSize: `${settings.fontSize}rem`,
    lineHeight: settings.lineHeight,
    '--highlight-bg': settings.highlightColor,
  } as React.CSSProperties;
  
  const paginatedStyle = settings.mode === 'page' ? {
    columnWidth: '100%',
    columnGap: `${settings.margin * 2}rem`,
    padding: `${settings.margin / 4}rem ${settings.margin}rem`,
    transition: settings.pageTurnAnimation === 'fade' ? 'opacity 0.3s ease-in-out' : 'none',
  } : {};

  const renderSentence = (sentence: string, index: number) => {
    if (!sentence || sentence.trim() === '') return null;
    const isCurrent = index === currentSentenceIndex;
    const annotation = annotations.find(a => a.sentenceIndex === index);
    
    const annotationStyle: React.CSSProperties = annotation ? {
        textDecoration: 'underline',
        textDecorationColor: annotation.color,
        textDecorationThickness: '2px',
        textUnderlineOffset: '3px',
    } : {};

    return (
        <span className="relative group">
            <span
                ref={isCurrent ? activeSentenceRef as React.RefObject<any> : null}
                data-sentence-index={index}
                onClick={() => onSentenceClick(index)}
                className={`cursor-pointer transition-all duration-300`}
                style={isCurrent ? { backgroundColor: 'var(--highlight-bg)', color: 'var(--reader-highlight-text)', ...annotationStyle } : annotationStyle}
            >
                {sentence}
                {annotation?.note && <MessageSquareIcon className="w-4 h-4 inline-block ml-1 align-middle text-blue-400" />}
            </span>
             <button
                onClick={(e) => onSentenceAction(index, e.currentTarget)}
                className="absolute -top-1 -right-1 p-1 bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                aria-label="Annotate sentence"
            >
                <PaletteIcon className="w-4 h-4 text-gray-300" />
            </button>{' '}
        </span>
    );
  }

  return (
    <div
      className="reader-view w-full max-w-4xl flex-grow bg-gray-900/70 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden mb-4 hc-bg hc-border"
      data-theme={settings.theme}
      data-font={settings.fontFamily}
      style={dynamicReaderStyle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <header className="reader-content flex-shrink-0 p-3 border-b border-gray-700 flex justify-between items-center gap-4 hc-bg hc-border z-10">
        <h2 className="text-lg font-semibold truncate">{chapter.title}</h2>
        <div className="flex items-center gap-2">
            {headerInfo}
            {actions}
        </div>
      </header>
      <div 
        ref={readerContentRef} 
        className={`reader-content flex-grow ${settings.mode === 'page' ? 'overflow-hidden' : 'overflow-y-auto'}`} 
        style={settings.mode !== 'page' ? { padding: `${settings.margin / 4}rem ${settings.margin}rem` } : {}}
      >
        {(settings.mode === 'scroll' || settings.mode === 'karaoke') && (
          <div className={`${settings.mode === 'karaoke' ? 'h-full flex flex-col justify-center text-center p-4' : ''}`}>
             {settings.mode === 'karaoke' && <p className="text-gray-400 opacity-50 mb-4 transition-opacity duration-300 animate-fade-in" style={{ fontSize: `${settings.fontSize * 0.9}rem` }}>{sentences[currentSentenceIndex - 1]}</p>}
             {sentences.map((sentence, index) => {
                const isCurrent = index === currentSentenceIndex;
                const annotation = annotations.find(a => a.sentenceIndex === index);
                const annotationStyle: React.CSSProperties = annotation ? {
                    textDecoration: 'underline',
                    textDecorationColor: annotation.color,
                    textDecorationThickness: '2px',
                    textUnderlineOffset: '3px',
                } : {};

                if (settings.mode === 'karaoke') {
                    if (!isCurrent) return null;
                     return (
                         <p key={index}
                            ref={activeSentenceRef as React.RefObject<any>}
                            onClick={() => onSentenceClick(index)}
                            className={`cursor-pointer font-semibold transition-opacity duration-300 animate-fade-in`}
                            style={{ backgroundColor: 'var(--highlight-bg)', color: 'var(--reader-highlight-text)', fontSize: `${settings.fontSize * 1.2}rem`, ...annotationStyle }}
                         >
                             {sentence}
                             {annotation?.note && <MessageSquareIcon className="w-5 h-5 inline-block ml-2 align-middle text-blue-300" />}
                         </p>
                     )
                }
                
                return (
                     <span key={index} className="relative group">
                        <span
                            ref={isCurrent ? activeSentenceRef as React.RefObject<any> : null}
                            onClick={() => onSentenceClick(index)}
                            className={`cursor-pointer transition-all duration-300`}
                            style={isCurrent ? { backgroundColor: 'var(--highlight-bg)', color: 'var(--reader-highlight-text)', ...annotationStyle } : annotationStyle}
                        >
                        {sentence}{' '}
                        {annotation?.note && <MessageSquareIcon className="w-4 h-4 inline-block align-middle text-blue-400" />}
                        </span>
                        <button
                            onClick={(e) => onSentenceAction(index, e.currentTarget)}
                            className="absolute -top-1 -right-1 p-1 bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                            aria-label="Annotate sentence"
                        >
                            <PaletteIcon className="w-4 h-4 text-gray-300" />
                        </button>
                    </span>
                );
             })}
             {settings.mode === 'karaoke' && <p className="text-gray-400 opacity-50 mt-4 transition-opacity duration-300 animate-fade-in" style={{ fontSize: `${settings.fontSize * 0.9}rem` }}>{sentences[currentSentenceIndex + 1]}</p>}
          </div>
        )}
        {settings.mode === 'page' && (
            <div className='h-full w-full relative'>
                <div 
                    ref={paginatedContentRef} 
                    className="h-full overflow-x-scroll overflow-y-hidden"
                    onScroll={handleScroll}
                    style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
                >
                    <div className="h-full text-justify" style={paginatedStyle}>
                        {sentences.map(renderSentence)}
                    </div>
                </div>
                {/* Page Navigation */}
                <button onClick={() => goToPage(pagination.currentPage - 1)} disabled={pagination.currentPage === 0} className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 rounded-full text-white backdrop-blur-sm hover:bg-black/50 transition-all disabled:opacity-0 ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <button onClick={() => goToPage(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages - 1} className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 rounded-full text-white backdrop-blur-sm hover:bg-black/50 transition-all disabled:opacity-0 ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
                    <ChevronRightIcon className="w-6 h-6" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm bg-black/30 text-white px-3 py-1 rounded-full backdrop-blur-sm">
                    {pagination.totalPages > 0 ? `Page ${pagination.currentPage + 1} of ${pagination.totalPages}` : 'Calculating...'}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ReaderView;