

import { CoreBookData, Chapter } from './types';
import { countWords, optimizeCoverImage } from './utils';

export const parseText = async (file: File): Promise<Omit<CoreBookData, 'id' | 'fileName' | 'cover' | 'createdAt'>> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const title = file.name.replace(/\.(txt|md)$/, '');
            const chapters: Chapter[] = [{ title: "Full Text", content: text }];
            resolve({ title, chapters, wordCount: countWords(text) });
        };
        reader.onerror = () => reject(new Error("Error reading file."));
        reader.readAsText(file);
    });
};

export const parsePdf = async (file: File, onProgress: (msg: string) => void, cancelRef: React.MutableRefObject<boolean>): Promise<Omit<CoreBookData, 'id' | 'fileName' | 'cover' | 'createdAt'>> => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async (event) => {
        if (!event.target?.result || cancelRef.current) return reject(new Error("Cancelled."));
        try {
          const pdf = await (window as any).pdfjsLib.getDocument(event.target.result).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            if (cancelRef.current) return reject(new Error("Cancelled by user."));
            onProgress(`Parsing PDF... page ${i} of ${pdf.numPages}`);
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
          }

          if (cancelRef.current) return reject(new Error("Cancelled by user."));

          // Heuristic to detect image-based PDFs
          if (fullText.trim().length < pdf.numPages * 20) {
            return reject(new Error("This PDF appears to be image-based or has very little text. Aurora Read requires PDFs with a selectable text layer to function."));
          }
          
          fullText = fullText.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

          const title = file.name.replace(/\.pdf$/, '');
          const chapterRegex = /^(chapter\s+\d+|[IVXLCDM]+\.?\s*$|prologue|epilogue|introduction)/im;
          const lines = fullText.split('\n');
          const chapters: Chapter[] = [];
          let currentChapterContent = '';
          let currentChapterTitle = `${title} - Part 1`;

          for (const line of lines) {
            if (chapterRegex.test(line.trim()) && line.trim().length < 50) {
              if (currentChapterContent.trim()) chapters.push({ title: currentChapterTitle, content: currentChapterContent.trim() });
              currentChapterTitle = line.trim();
              currentChapterContent = '';
            } else {
              currentChapterContent += line + '\n';
            }
          }
          if (currentChapterContent.trim()) chapters.push({ title: currentChapterTitle, content: currentChapterContent.trim() });
          if (chapters.length === 0 && fullText.trim()) chapters.push({ title: "Full Text", content: fullText.trim() });
          resolve({ title, chapters, wordCount: countWords(fullText) });
        } catch (err) { reject(err instanceof Error && err.message === "Cancelled by user." ? err : new Error("Could not parse the PDF file.")); }
      };
      reader.onerror = () => reject(new Error("Error reading file."));
      reader.readAsArrayBuffer(file);
    });
};
  
export const parseEpub = async (file: File, onProgress: (msg: string) => void, cancelRef: React.MutableRefObject<boolean>): Promise<Omit<CoreBookData, 'id' | 'fileName' | 'createdAt'>> => {
    const JSZip = (window as any).JSZip;
    if (typeof JSZip !== 'function') {
      throw new Error("A required dependency (JSZip) could not be loaded. Please check your internet connection and refresh the page.");
    }

    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async (event) => {
        if (!event.target?.result || cancelRef.current) return reject(new Error("Cancelled."));

        try {
          onProgress("Unzipping EPUB file...");
          const zip = await JSZip.loadAsync(event.target.result);

          const containerXml = await zip.file("META-INF/container.xml")?.async("string");
          if (!containerXml) throw new Error("Invalid EPUB: META-INF/container.xml not found.");

          const parser = new DOMParser();
          const containerDoc = parser.parseFromString(containerXml, "application/xml");
          const rootFilePath = containerDoc.getElementsByTagName("rootfile")[0]?.getAttribute("full-path");
          if (!rootFilePath) throw new Error("Invalid EPUB: Root file not found in container.xml.");

          const rootFile = zip.file(rootFilePath);
          if (!rootFile) throw new Error(`Invalid EPUB: Root file at ${rootFilePath} not found.`);

          const contentOpf = await rootFile.async("string");
          const opfDoc = parser.parseFromString(contentOpf, "application/xml");
          const opfDir = rootFilePath.includes('/') ? rootFilePath.substring(0, rootFilePath.lastIndexOf('/')) + '/' : '';
          
          const metadata = opfDoc.getElementsByTagName("metadata")[0];
          const title = metadata?.getElementsByTagName("dc:title")[0]?.textContent || file.name.replace(/\.epub$/, '');
          const author = metadata?.getElementsByTagName("dc:creator")[0]?.textContent;
          const genre = metadata?.getElementsByTagName("dc:subject")[0]?.textContent;
          const date = metadata?.getElementsByTagName("dc:date")[0]?.textContent;
          const year = date ? new Date(date).getFullYear() : undefined;

          const manifestItems = opfDoc.getElementsByTagName("item");
          const manifest: { [id: string]: { href: string; 'media-type': string; properties?: string } } = {};
          for (const item of manifestItems) {
            const id = item.getAttribute("id");
            const href = item.getAttribute("href");
            const mediaType = item.getAttribute("media-type");
            const properties = item.getAttribute("properties");
            if (id && href && mediaType) {
              manifest[id] = { href: opfDir + href, 'media-type': mediaType, properties };
            }
          }

          const spineItems = opfDoc.getElementsByTagName("itemref");
          const spine: string[] = Array.from(spineItems).map(item => item.getAttribute("idref") || "").filter(Boolean);
          const chapters: Chapter[] = [];
          let tocFound = false;

          // Priority 1: EPUB 3 Navigation Document (nav.xhtml)
          const navId = Object.keys(manifest).find(id => manifest[id].properties?.includes('nav'));
          if (navId && manifest[navId]) {
              onProgress("Parsing EPUB 3 navigation...");
              const navFile = manifest[navId];
              try {
                  const navHtml = await zip.file(navFile.href)?.async("string");
                  if (navHtml) {
                      const navDoc = parser.parseFromString(navHtml, "text/html");
                      const tocNav = navDoc.querySelector('nav[epub\\:type="toc"], nav[role="doc-toc"]');
                      if (tocNav) {
                          const navPath = navFile.href.includes('/') ? navFile.href.substring(0, navFile.href.lastIndexOf('/')) + '/' : '';
                          const tocLinks = tocNav.querySelectorAll('a');
                          for (const link of tocLinks) {
                              const href = link.getAttribute('href');
                              if (href) {
                                  chapters.push({
                                      title: link.textContent?.trim() || "Untitled Chapter",
                                      content: navPath + href,
                                  });
                              }
                          }
                          if (chapters.length > 0) tocFound = true;
                      }
                  }
              } catch (e) {
                  console.warn("Could not parse EPUB 3 nav document, falling back.", e);
              }
          }

          // Priority 2: EPUB 2 NCX Table of Contents
          if (!tocFound) {
              onProgress("Parsing EPUB 2 NCX...");
              const tocId = opfDoc.querySelector("spine")?.getAttribute("toc");
              const tocNav = manifest[tocId || 'ncx'];
              if (tocNav && tocNav.href.endsWith('.ncx')) {
                  try {
                      const tocXml = await zip.file(tocNav.href)?.async("string");
                      if(tocXml) {
                        const tocDoc = parser.parseFromString(tocXml, "application/xml");
                        const navPoints = tocDoc.getElementsByTagName("navPoint");
                        for (const point of navPoints) {
                          const label = point.getElementsByTagName("text")[0]?.textContent || "Untitled Chapter";
                          const src = point.getElementsByTagName("content")[0]?.getAttribute("src");
                          if (src) {
                            const path = tocNav.href.includes('/') ? tocNav.href.substring(0, tocNav.href.lastIndexOf('/')) + '/' : '';
                            chapters.push({ title: label.trim(), content: path + src });
                          }
                        }
                        if (chapters.length > 0) tocFound = true;
                      }
                  } catch (e) {
                      console.warn("Could not parse NCX file, falling back to spine.", e);
                  }
              }
          }

          // Priority 3: Fallback to Spine order
          if (!tocFound) {
              onProgress("No valid TOC found, building from spine...");
              for(const idref of spine) {
                  if (manifest[idref]) {
                      let chapterTitle = manifest[idref].href.split('/').pop()?.replace(/\.(xhtml|html|htm)$/, '').replace(/[-_]/g, ' ') || idref;
                      chapterTitle = chapterTitle.charAt(0).toUpperCase() + chapterTitle.slice(1);
                      chapters.push({ title: chapterTitle, content: manifest[idref].href });
                  }
              }
          }
          
          let cover: string | undefined;
          const coverMeta = Array.from(opfDoc.getElementsByTagName("meta")).find(m => m.getAttribute('name') === 'cover');
          if(coverMeta) {
             const coverId = coverMeta.getAttribute('content');
             if(coverId && manifest[coverId]) {
                const coverFile = zip.file(manifest[coverId].href);
                if(coverFile) {
                    const blob = await coverFile.async('blob');
                    const rawCover = await new Promise<string>((res) => {
                        const r = new FileReader(); r.onloadend = () => res(r.result as string); r.readAsDataURL(blob);
                    });
                    if (rawCover && rawCover.startsWith('data:image')) {
                        onProgress("Optimizing cover image...");
                        cover = await optimizeCoverImage(rawCover);
                    } else {
                        cover = rawCover;
                    }
                }
             }
          }

          const extractTextFromHtml = (htmlString: string): string => {
            const doc = parser.parseFromString(htmlString, "text/html");
            const body = doc.querySelector('body');
            if (!body) return '';
            body.querySelectorAll('script, style, noscript, [aria-hidden="true"]').forEach(el => el.remove());
            return body.innerText.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
          };

          const finalChapters: Chapter[] = [];
          let totalWordCount = 0;
          for (const [index, chapter] of chapters.entries()) {
            if (cancelRef.current) throw new Error("Cancelled by user.");
            onProgress(`Processing chapter ${index + 1} of ${chapters.length}`);
            const chapterFile = zip.file(chapter.content.split('#')[0]); // remove anchors
            if (chapterFile) {
              const htmlContent = await chapterFile.async("string");
              const textContent = extractTextFromHtml(htmlContent);
              if (textContent) {
                totalWordCount += countWords(textContent);
                finalChapters.push({ title: chapter.title, content: textContent });
              }
            }
          }
           if (finalChapters.length === 0) throw new Error("Could not extract any text content from the EPUB.");

          resolve({ title, author, genre, year, chapters: finalChapters, cover, wordCount: totalWordCount });

        } catch (err) {
          console.error("EPUB Parsing Error:", err);
          reject(err instanceof Error && err.message.startsWith("Cancelled") ? err : new Error("Could not parse the EPUB file. It might be corrupted or lack a standard structure."));
        }
      };

      reader.onerror = () => reject(new Error("Error reading file."));
      reader.readAsArrayBuffer(file);
    });
};