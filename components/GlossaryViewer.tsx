
import React from 'react';
import { GlossaryItem } from '../types';

const GlossaryViewer: React.FC<{ items: GlossaryItem[] }> = ({ items }) => {
    if (!items || items.length === 0) {
        return <p className="text-center text-gray-400 hc-dim-text">No glossary terms were generated for this chapter.</p>;
    }
    return (
        <div className="flex flex-col gap-4">
            {items.map((item, index) => (
                <div key={index} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50">
                    <h3 className="font-semibold text-lg text-indigo-300 hc-accent-text">{item.term}</h3>
                    <p className="text-gray-300 mt-1 hc-text">{item.definition}</p>
                </div>
            ))}
        </div>
    );
};

export default GlossaryViewer;
