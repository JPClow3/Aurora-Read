import { ReaderSettings } from './types';

// FIX: Expanded default settings to include all properties from the ReaderSettings interface.
export const DEFAULT_READER_SETTINGS: ReaderSettings = {
    theme: 'sepia',
    fontFamily: 'serif',
    fontSize: 1.1, // rem
    lineHeight: 1.6,
    mode: 'scroll',
    pageTurnAnimation: 'slide',
    margin: 2.0, // rem
    bionicReading: false,
    autoScroll: true,
    highlightColor: '#fef08a', // A pleasant yellow
    autoScrollAlignment: 'center',
    paperSimulation: false,
};

// FIX: Added constant for annotation colors used in the AnnotationMenu.
export const ANNOTATION_COLORS = [
    '#fef08a', // yellow
    '#86efac', // green
    '#93c5fd', // blue
    '#f9a8d4', // pink
    '#fca5a5', // red
];