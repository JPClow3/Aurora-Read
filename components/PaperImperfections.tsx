import React, { useMemo } from 'react';

const stains = [
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImEiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzZCNEMzOCIgc3RvcC1vcGFjaXR5PSIwLjUiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM2QjRDMzgiIHN0b3Atb3BhY2l0eT0iMCIvPjwvcmFkaWFsR3JhZGllbnQ+PC9kZWZzPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjUwIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+',
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgODAiPjxkZWZzPjxlbGxpcHRpY2FsR3JhZGllbnQgaWQ9ImIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjeD0iNjAiIGN5PSI0MCIgcng9IjYwIiByeT0iNDAiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzc4NTYzNCIgc3RvcC1vcGFjaXR5PSIwLjQiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3ODU2MzQiIHN0b3Atb3BhY2l0eT0iMCIvPjwvZWxsaXB0aWNhbEdyYWRpZW50PjwvZGVmcz48ZWxsaXBzZSBjeD0iNjAiIGN5PSI0MCIgcng9IjYwIiByeT0iNDAiIGZpbGw9InVybCgjYikiLz48L3N2Zz4=',
];

interface PaperImperfectionsProps {
  pageElement: HTMLDivElement | null;
}

const PaperImperfections: React.FC<PaperImperfectionsProps> = ({ pageElement }) => {
  const imperfections = useMemo(() => {
    if (!pageElement) return [];
    
    const rect = pageElement.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    const count = Math.floor(Math.random() * 3) + 2; // 2 to 4 imperfections
    const margin = 50; 

    return Array.from({ length: count }).map((_, i) => {
      const side = Math.floor(Math.random() * 4);
      let top, left;

      switch(side) {
        case 0: // top
          top = -margin + Math.random() * margin * 1.5;
          left = Math.random() * containerWidth;
          break;
        case 1: // right
          top = Math.random() * containerHeight;
          left = containerWidth - margin / 2 + Math.random() * margin;
          break;
        case 2: // bottom
          top = containerHeight - margin / 2 + Math.random() * margin;
          left = Math.random() * containerWidth;
          break;
        default: // left
          top = Math.random() * containerHeight;
          left = -margin + Math.random() * margin * 1.5;
          break;
      }
      
      const size = 80 + Math.random() * 80;
      
      return {
        id: i,
        top: `${top}px`,
        left: `${left}px`,
        width: `${size}px`,
        height: `${size}px`,
        transform: `rotate(${Math.random() * 360}deg) translate(-50%, -50%)`,
        opacity: 0.04 + Math.random() * 0.06,
        backgroundImage: `url('${stains[i % stains.length]}')`,
      };
    });
  }, [pageElement]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
      {imperfections.map(style => (
        <div key={style.id} className="absolute bg-contain bg-no-repeat" style={style} />
      ))}
    </div>
  );
};

export default PaperImperfections;