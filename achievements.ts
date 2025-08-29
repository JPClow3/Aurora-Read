
import { AppSettings, Book } from './types';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'BookOpenIcon' | 'AwardIcon' | 'ClockIcon' | 'ZapIcon';
  isUnlocked: (library: Book[], settings: AppSettings) => boolean;
}

const totalListenTimeHours = (settings: AppSettings) => {
    return Object.values(settings.readingLog).reduce((sum, seconds) => sum + seconds, 0) / 3600;
};

const calculateStreak = (readingLog: Record<string, number>): number => {
    let currentStreak = 0;
    const today = new Date();
    let currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if ((readingLog[dateStr] || 0) > 0) {
            currentStreak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            return currentStreak;
        }
    }
}


export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_book',
        title: 'Bookworm Beginner',
        description: 'Finish your first book.',
        icon: 'AwardIcon',
        isUnlocked: (library) => library.some(b => b.finishedAt),
    },
    {
        id: 'five_books',
        title: 'Avid Reader',
        description: 'Finish 5 books.',
        icon: 'AwardIcon',
        isUnlocked: (library) => library.filter(b => b.finishedAt).length >= 5,
    },
    {
        id: 'one_hour',
        title: 'Hour Hero',
        description: 'Listen for a total of 1 hour.',
        icon: 'ClockIcon',
        isUnlocked: (library, settings) => totalListenTimeHours(settings) >= 1,
    },
     {
        id: 'ten_hours',
        title: 'Listening Legend',
        description: 'Listen for a total of 10 hours.',
        icon: 'ClockIcon',
        isUnlocked: (library, settings) => totalListenTimeHours(settings) >= 10,
    },
    {
        id: 'streak_three',
        title: 'On a Roll',
        description: 'Maintain a 3-day reading streak.',
        icon: 'ZapIcon',
        isUnlocked: (library, settings) => calculateStreak(settings.readingLog) >= 3
    },
    {
        id: 'streak_seven',
        title: 'Streak Sovereign',
        description: 'Maintain a 7-day reading streak.',
        icon: 'ZapIcon',
        isUnlocked: (library, settings) => calculateStreak(settings.readingLog) >= 7
    }
];
