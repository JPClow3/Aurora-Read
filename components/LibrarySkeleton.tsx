import React from 'react';

const SkeletonCard: React.FC = () => (
    <div className="flex flex-col gap-2">
        <div className="aspect-[2/3] bg-gray-700 rounded-lg animate-pulse"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
        <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
    </div>
);

const LibrarySkeleton: React.FC = () => {
    return (
        <div className="w-full max-w-7xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </div>
    );
};

export default LibrarySkeleton;
