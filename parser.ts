import ePub from 'epubjs';
import { CoreBookData, Chapter } from './types';

// The entire worker code is encapsulated in a string to be loaded via a Blob.
// This avoids needing a separate file and simplifies the build process.
const workerCode = `
self.onmessage = (event) => {
  const file = event.data;
  const reader = new FileReader();

  reader.onload = (e) => {
    const text = e.target.result;
    if (!text) {
      self.postMessage({ error: 'File is empty or could not be read.' });
      return;
    }

    try {
      const lines = text.split(/\\r?\\n/);
      const chapters = [];
      let currentChapterContent = [];
      // Use a more generic title for the first section of text before a chapter heading is found.
      let currentChapterTitle = 'Prologue'; 

      // Regex to find chapter headings. Case-insensitive 'chapter', 'book', or 'part' then space, then number or roman numeral.
      const chapterRegex = /^(chapter|CHAPTER|\\s*BOOK\\s*|\\s*PART\\s*)\\s+([0-9]+|[IVXLCDM]+)/i;
      // Heuristic for other titles: a short line (5-70 chars) in all caps, without sentence-ending punctuation.
      const shortAllCapsRegex = /^[A-Z0-9\\s'’,-]{5,70}$/;
      const endsWithPunctuation = /[.!?]$/;

      let lastLineWasBlank = false;

      lines.forEach(line => {
        const trimmedLine = line.trim();

        // A line is considered a potential chapter heading if it matches a clear pattern (e.g., "CHAPTER 1")
        // or is a short, all-caps line that isn't part of a sentence. This is often more reliable
        // if it's preceded by a blank line.
        const isPotentialHeading = (chapterRegex.test(trimmedLine) || (shortAllCapsRegex.test(trimmedLine) && !endsWithPunctuation.test(trimmedLine)));
        
        if (isPotentialHeading && lastLineWasBlank) {
          // If we have content, save the previous chapter. We check for a minimum length
          // to avoid creating chapters from tables of contents or title pages.
          if (currentChapterContent.join('').trim().length > 100) {
            chapters.push({
              title: currentChapterTitle,
              content: currentChapterContent.join('\\n').trim(),
            });
          }
          // Start a new chapter with the detected heading as the title.
          currentChapterTitle = trimmedLine;
          currentChapterContent = [];
        } else {
          currentChapterContent.push(line);
        }
        
        lastLineWasBlank = trimmedLine === '';
      });

      // Add the last chapter after the loop finishes.
      if (currentChapterContent.join('').trim().length > 100) {
        chapters.push({
          title: currentChapterTitle,
          content: currentChapterContent.join('\\n').trim(),
        });
      }

      // If our heuristics didn't find any chapters, we fall back to treating the entire file as one chapter.
      if (chapters.length === 0 && text.length > 0) {
        chapters.push({ title: 'Full Text', content: text });
      }

      self.postMessage({ result: { chapters } });
    } catch (e) {
        const err = e as Error;
        self.postMessage({ error: err.message });
    }
  };
  
  reader.onerror = () => {
    self.postMessage({ error: 'Error reading file in worker.' });
  };

  reader.readAsText(file);
};
`;

const parseText = (file: File): Promise<Omit<CoreBookData, 'id' | 'fileName' | 'fileType' | 'epubData'>> => {
    // Check for browser support for Web Workers.
    if (window.Worker) {
        return new Promise((resolve, reject) => {
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const workerURL = URL.createObjectURL(blob);
            const worker = new Worker(workerURL);

            worker.onmessage = (event) => {
                if (event.data.error) {
                    reject(new Error(event.data.error));
                } else {
                    const { chapters } = event.data.result;
                    const title = file.name.replace(/\.(txt|md)$/i, '');
                    resolve({ title, chapters });
                }
                // Terminate the worker and revoke the URL to free up resources.
                worker.terminate();
                URL.revokeObjectURL(workerURL);
            };

            worker.onerror = (event) => {
                reject(new Error(`Worker error: ${event.message}`));
                worker.terminate();
                URL.revokeObjectURL(workerURL);
            };

            // Send the file to the worker to begin processing off the main thread.
            worker.postMessage(file);
        });
    } else {
        // Provide a fallback for older browsers that do not support Web Workers.
        // This will run on the main thread.
        console.warn("Web Workers not supported. Parsing on main thread.");
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                if (!text) {
                    return reject(new Error("File is empty or could not be read."));
                }
                const title = file.name.replace(/\.(txt|md)$/i, '');
                // Use the simplest parsing logic for the fallback.
                const chapters: Chapter[] = [{ title: "Full Text", content: text }];
                resolve({ title, chapters });
            };
            reader.onerror = () => reject(new Error("Error reading file."));
            reader.readAsText(file);
        });
    }
};

const parseEpub = async (file: File): Promise<Omit<CoreBookData, 'id' | 'fileName'>> => {
    const book = ePub();
    const arrayBuffer = await file.arrayBuffer();
    await book.open(arrayBuffer);
    
    if (!book.loaded || !book.loaded.metadata || !book.loaded.navigation) {
        throw new Error('Failed to load EPUB metadata or navigation.');
    }

    // FIX: The `metadata` and `navigation` properties are promises. Await them to get the book's data.
    const metadata = await book.loaded.metadata;
    const navigation = await book.loaded.navigation;

    // FIX: Access properties from the resolved metadata object.
    const title = metadata.title;
    const author = metadata.creator;
    
    let coverUrl: string | undefined;
    // FIX: The `cover` property may exist at runtime but is missing from the type definitions. Use a type assertion to bypass the static check.
    if ((book as any).cover) {
        coverUrl = await book.coverUrl();
    }

    // FIX: Access 'toc' from the resolved navigation object.
    const toc = navigation.toc;
    const chapters: Chapter[] = await Promise.all(toc.map(async (item) => {
        const section = book.section(item.href);
        if (!section) return { title: item.label.trim(), content: '<p>Content not found.</p>', href: item.href };
        
        await section.load();
        const content = section.contents?.innerHTML || '';
        section.unload();

        return {
            title: item.label.trim(),
            content: content,
            href: item.href,
        };
    }));
    
    book.destroy();

    return {
        title,
        author,
        cover: coverUrl,
        chapters: chapters.length > 0 ? chapters : [{ title: 'Full Text', content: '<p>Could not parse chapters.</p>', href: '' }],
        fileType: 'epub',
        epubData: arrayBuffer,
    };
};

export const parseFile = (file: File): Promise<Omit<CoreBookData, 'id' | 'fileName'>> => {
    if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        return parseText(file).then(result => ({ ...result, fileType: 'txt' }));
    } else if (file.name.toLowerCase().endsWith('.epub')) {
        return parseEpub(file);
    } else {
        return Promise.reject(new Error("Unsupported file type. Please upload a .txt or .epub file."));
    }
};
