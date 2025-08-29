
import React, { useMemo } from 'react';
import { AppSettings, Book } from '../types';
import { BookOpenIcon, AwardIcon, ClockIcon, ZapIcon } from './Icons';
import { ACHIEVEMENTS, Achievement } from '../achievements';

interface ProfileViewProps {
  library: Book[];
  appSettings: AppSettings;
}

const formatSeconds = (seconds: number): string => {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m`;
  return result.trim() || '0m';
};

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


const ProfileView: React.FC<ProfileViewProps> = ({ library, appSettings }) => {
  const stats = useMemo(() => {
    const { readingLog } = appSettings;

    // Total Listen Time
    const totalListenTime = Object.values(readingLog).reduce((sum, seconds) => sum + seconds, 0);

    // Books Finished
    const booksFinished = library.filter(book => book.finishedAt).length;

    // Favorite Genre
    const genreCounts = library.reduce((acc, book) => {
        if (book.finishedAt && book.genre) {
            acc[book.genre] = (acc[book.genre] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);
    const favoriteGenre = Object.keys(genreCounts).reduce((a, b) => genreCounts[a] > genreCounts[b] ? a : b, 'N/A');

    // Reading Streak
    let currentStreak = 0;
    const today = new Date();
    let currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (readingLog[dateStr] > 0) {
            currentStreak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    // Weekly Chart Data
    const weeklyData = [];
    let maxWeeklyMinutes = 0;
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const minutes = Math.floor((readingLog[dateStr] || 0) / 60);
        if (minutes > maxWeeklyMinutes) maxWeeklyMinutes = minutes;
        weeklyData.push({
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            minutes: minutes
        });
    }

    return { totalListenTime, booksFinished, favoriteGenre, currentStreak, weeklyData, maxWeeklyMinutes };
  }, [library, appSettings]);

  const unlockedAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter(ach => ach.isUnlocked(library, appSettings));
  }, [library, appSettings]);

  const lockedAchievements = useMemo(() => {
      return ACHIEVEMENTS.filter(ach => !ach.isUnlocked(library, appSettings));
  }, [library, appSettings]);
  
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
            <h3 className="text-lg font-semibold text-white mb-4 hc-text">Weekly Activity</h3>
            <div className="flex justify-between items-end h-48 gap-2">
                {stats.weeklyData.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end gap-2 group">
                        <div className="w-full h-full flex items-end">
                             <div 
                                className="w-full bg-indigo-500 rounded-t-md transition-all duration-300 ease-out group-hover:bg-indigo-400 hc-accent-bg" 
                                style={{ height: stats.maxWeeklyMinutes > 0 ? `${(day.minutes / stats.maxWeeklyMinutes) * 100}%` : '0%' }}
                                title={`${day.minutes} minutes`}
                            ></div>
                        </div>
                        <span className="text-xs text-gray-400 hc-dim-text">{day.day}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard title="Favorite Genre" value={stats.favoriteGenre} description="Based on completed books" />
        </div>
    </div>
  );
};

export default ProfileView;
