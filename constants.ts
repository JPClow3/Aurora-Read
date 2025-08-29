

import { ReaderSettings } from './types';

export const SHARED_QUOTES_KEY = 'audiobook_shared_quotes';

export const ANNOTATION_COLORS = ['#fef08a', '#f9a8d4', '#a5f3fc', '#a7f3d0']; // yellow, pink, cyan, green

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
    mode: 'scroll',
    theme: 'dark',
    fontFamily: 'sans',
    fontSize: 1.1, // rem
    lineHeight: 1.6,
    margin: 2, // rem
    highlightColor: 'rgba(99, 102, 241, 0.4)', // bg-indigo-500/40
    autoScroll: true,
    autoScrollAlignment: 'center',
    pageTurnAnimation: 'slide',
};