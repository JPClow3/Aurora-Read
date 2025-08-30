import React, { useMemo } from 'react';
import { AppSettings, Book } from '../types';
import { BookOpenIcon, AwardIcon, ClockIcon, ZapIcon } from './Icons';
import { ACHIEVEMENTS, Achievement } from '../achievements';

// FIX: Define the props interface for ProfileView to resolve 'Cannot find name 'ProfileViewProps'' error
// and subsequent cascading type errors within the component.
interface ProfileViewProps {
  library: Book[];
  appSettings: AppSettings;
}

const StatCard: React.FC<{ title: string; value: string | number; description?: string }> = ({ title, value, description }) => (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6 hc-bg hc-border">
        <p className="text-sm text-gray-400 hc-dim-text">{title}</p>
        <p className="text-4xl font-bold text-white mt-2 hc-text">{value}</p>
        {description && <p className="text-sm text-gray-500 mt-1 hc-dim-text">{description}</p>}
    </div>
);

const AchievementCard: React.FC<{ achievement: Achievement; unlocked?: boolean }> = ({ achievement, unlocked }) => {
    const Icon = { AwardIcon, ClockIcon, ZapIcon, BookOpenIcon }[achievement.icon];
    
    return (
        <div className={`p-4 rounded-lg text-center transition-all ${unlocked ? 'bg-gradient-to-br from-indigo-800 to-indigo-900/50 border border-indigo-600' : 'bg-gray-700/50 border border-gray-600 opacity-60'}`}>
            <Icon className={`w-10 h-10 mx-auto mb-2 ${unlocked ? 'text-yellow-400' : 'text-gray-400'}`} />
            <p className={`font-semibold text-sm ${unlocked ? 'text-white' : 'text-gray-300'}`}>{achievement.title}</p>
            <p className="text-xs text-gray-400 mt-1">{achievement.description}</p>
        </div>
    );
};

const CalendarHeatmap: React.FC<{ readingLog: Record<string, number>, days?: number }> = ({ readingLog, days = 91 }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = useMemo(() => {
        const result = [];
        let maxMinutes = 0;
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const minutes = Math.floor((readingLog[dateStr] || 0) / 60);
            if (minutes > maxMinutes) maxMinutes = minutes;
            result.push({ date, minutes });
        }
        return { entries: result.reverse(), maxMinutes };
    }, [readingLog, days]);
    
    const { entries, maxMinutes } = data;
    if (!entries.length) return null;

    const firstDay = entries[0].date.getDay(); // Sunday - 0, Monday - 1, etc.
    const weeks = Math.ceil((entries.length + firstDay) / 7);
    
    const getColor = (minutes: number) => {
        if (minutes === 0) return 'bg-gray-700/50';
        const intensity = Math.min(1, Math.max(0.2, minutes / (maxMinutes * 0.8)));
        return `bg-indigo-500 opacity-${Math.floor(intensity * 10) * 10 + 30}`;
    };

    return (
        <div className="grid grid-cols-7 gap-1.5" style={{ gridTemplateRows: `repeat(${weeks}, 1fr)` }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {entries.map(({ date, minutes }, i) => (
                <div key={i} className={`w-full aspect-square rounded ${getColor(minutes)}`} title={`${date.toDateString()}: ${minutes} min`} />
            ))}
        </div>
    );
};

const PieChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
    const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f59e0b', '#10b981'];
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
        return <p className="text-center text-gray-400 py-8">No data available.</p>;
    }

    let cumulativePercent = 0;
    const segments = data.map((item, index) => {
        const percent = (item.value / total);
        const [startX, startY] = [Math.cos(2 * Math.PI * cumulativePercent), Math.sin(2 * Math.PI * cumulativePercent)];
        cumulativePercent += percent;
        const [endX, endY] = [Math.cos(2 * Math.PI * cumulativePercent), Math.sin(2 * Math.PI * cumulativePercent)];
        const largeArcFlag = percent > 0.5 ? 1 : 0;
        
        return {
            path: `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            color: COLORS[index % COLORS.length],
            label: item.label,
            value: item.value,
        };
    });

    return (
      <div className="flex flex-col md:flex-row items-center gap-6">
        <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-40 h-40 transform -rotate-90">
            {segments.map((seg, i) => (
                <path key={i} d={seg.path} stroke={seg.color} strokeWidth="0.5" fill="none" />
            ))}
        </svg>
        <div className="flex-grow space-y-2 text-sm">
            {segments.map((seg, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="text-gray-300">{seg.label}</span>
                    <span className="ml-auto text-gray-400">{seg.value} book{seg.value > 1 ? 's' : ''}</span>
                </div>
            ))}
        </div>
      </div>
    );
};


const LineChart: React.FC<{ data: { date: Date, minutes: number }[] }> = ({ data }) => {
    const width = 300, height = 100, padding = 10;
    const maxMins = Math.max(30, ...data.map(d => d.minutes));
    
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
        const y = height - padding - (d.minutes / maxMins) * (height - padding * 2);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
             <defs>
                <linearGradient id="line-chart-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                </linearGradient>
            </defs>
            <polyline fill="url(#line-chart-gradient)" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={`${padding},${height-padding} ${points} ${width-padding},${height-padding}`} />
            <polyline fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height-padding} stroke="#4b5563" strokeWidth="1" />
            <text x={padding} y={padding-2} fontSize="8" fill="#9ca3af">{maxMins} min</text>
            <text x={padding} y={height-2} fontSize="8" fill="#9ca3af">30 days ago</text>
            <text x={width - padding} y={height-2} textAnchor="end" fontSize="8" fill="#9ca3af">Today</text>
        </svg>
    );
};


const ProfileView: React.FC<ProfileViewProps> = ({ library, appSettings }) => {
  const stats = useMemo(() => {
    const { readingLog } = appSettings;

    const totalListenTime = Object.values(readingLog).reduce((sum, seconds) => sum + seconds, 0);
    const booksFinished = library.filter(book => book.finishedAt).length;

    let currentStreak = 0;
    const today = new Date();
    let currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (readingLog[dateStr] > 0) {
            currentStreak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else { break; }
    }
    
    const finishedBooks = library.filter(b => b.finishedAt);
    const genreCounts = finishedBooks.reduce((acc, book) => {
        const genre = book.genre || 'Uncategorized';
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const genreData = Object.entries(genreCounts).map(([label, value]) => ({ label, value }));

    const thirtyDayLog = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        thirtyDayLog.push({
            date,
            minutes: Math.floor((appSettings.readingLog[dateStr] || 0) / 60)
        });
    }

    return { totalListenTime, booksFinished, currentStreak, genreData, thirtyDayLog };
  }, [library, appSettings]);

  const unlockedAchievements = useMemo(() => ACHIEVEMENTS.filter(ach => ach.isUnlocked(library, appSettings)), [library, appSettings]);
  const lockedAchievements = useMemo(() => ACHIEVEMENTS.filter(ach => !ach.isUnlocked(library, appSettings)), [library, appSettings]);
  
  const formatSeconds = (seconds: number): string => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m`;
    return result.trim() || '0m';
  };

  if (library.length === 0) {
    return (
        <div className="w-full text-center py-20 px-6 bg-gray-800/20 rounded-2xl border-2 border-dashed border-gray-700/80 animate-fade-in">
            <BookOpenIcon className="mx-auto w-16 h-16 text-gray-600 hc-dim-text" />
            <h3 className="mt-4 text-2xl font-semibold text-gray-100 hc-text">No Stats Yet</h3>
            <p className="mt-2 text-lg text-gray-400 hc-dim-text">Start listening to a book to see your progress here.</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-4xl flex flex-col gap-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Current Streak" value={stats.currentStreak} description={stats.currentStreak === 1 ? "day" : "days"} />
            <StatCard title="Total Listen Time" value={formatSeconds(stats.totalListenTime)} />
            <StatCard title="Books Finished" value={stats.booksFinished} description={stats.booksFinished === 1 ? "book" : "books"} />
        </div>
        
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6 hc-bg hc-border">
            <h3 className="text-lg font-semibold text-white mb-4 hc-text">Achievements</h3>
            {unlockedAchievements.length === 0 && lockedAchievements.length === 0 ? <p className='text-gray-400 text-center'>No achievements defined.</p> : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {unlockedAchievements.map(ach => <AchievementCard key={ach.id} achievement={ach} unlocked />)}
                    {lockedAchievements.map(ach => <AchievementCard key={ach.id} achievement={ach} />)}
                </div>
            )}
        </div>

        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6 hc-bg hc-border">
            <h3 className="text-lg font-semibold text-white mb-4 hc-text">Reading Activity (Last 3 Months)</h3>
            <CalendarHeatmap readingLog={appSettings.readingLog} days={91} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6 hc-bg hc-border">
                <h3 className="text-lg font-semibold text-white mb-4 hc-text">Genre Breakdown (Finished Books)</h3>
                <PieChart data={stats.genreData} />
            </div>
            <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6 hc-bg hc-border">
                <h3 className="text-lg font-semibold text-white mb-4 hc-text">Listening Time (Last 30 Days)</h3>
                <LineChart data={stats.thirtyDayLog} />
            </div>
        </div>
    </div>
  );
};

export default ProfileView;