import React from 'react';
import type { LucideProps } from 'lucide-react';
import { Play, Pause, Square, Bookmark, Star, Heart } from 'lucide-react';

// Direct re-exports with aliasing to keep component names the same
export {
  Upload as UploadIcon,
  BookOpen as BookOpenIcon,
  FileText as FileTextIcon,
  Plus as PlusIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Sparkles as SparklesIcon,
  X as XIcon,
  Trash2 as TrashIcon,
  List as ListIcon,
  Settings as SettingsIcon,
  FilePenLine as EditIcon,
  LayoutGrid as CardsIcon,
  SkipBack as SkipBackIcon,
  SkipForward as SkipForwardIcon,
  Lightbulb as LightbulbIcon,
  BookText as BookTextIcon,
  Languages as LanguagesIcon,
  SlidersHorizontal as SlidersHorizontalIcon,
  Share2 as Share2Icon,
  Users as UsersIcon,
  Volume2 as Volume2Icon,
  Palette as PaletteIcon,
  Type as TypeIcon,
  Maximize as MaximizeIcon,
  User as UserIcon,
  Tag as TagIcon,
  MessageSquare as MessageSquareIcon,
  BarChart3 as BarChartIcon,
  Download as DownloadIcon,
  Award as AwardIcon,
  Clock as ClockIcon,
  Zap as ZapIcon,
  HelpCircle as HelpCircleIcon,
  LogOut as LogOutIcon,
  Search as SearchIcon,
  ListFilter as SortIcon,
} from 'lucide-react';

// Wrapper components for icons that need to be filled by default
export const PlayIcon: React.FC<LucideProps> = (props) => <Play fill="currentColor" {...props} />;
export const PauseIcon: React.FC<LucideProps> = (props) => <Pause fill="currentColor" {...props} />;
export const StopIcon: React.FC<LucideProps> = (props) => <Square fill="currentColor" {...props} />;

// Wrapper components for icons that have a custom 'filled' prop
interface FilledIconProps extends LucideProps {
  filled?: boolean;
  // FIX: Add className to the interface to solve typing errors when passing it as a prop.
  className?: string;
}

// FIX: Explicitly destructure and pass `className` prop to resolve TypeScript error where it was not being recognized.
export const BookmarkIcon: React.FC<FilledIconProps> = ({ filled, className, ...props }) => {
  return <Bookmark fill={filled ? 'currentColor' : 'none'} className={className} {...props} />;
};

// FIX: Explicitly destructure and pass `className` prop to resolve TypeScript error where it was not being recognized.
export const StarIcon: React.FC<FilledIconProps> = ({ filled, className, ...props }) => {
  return <Star fill={filled ? 'currentColor' : 'none'} className={className} {...props} />;
};

export const HeartIcon: React.FC<FilledIconProps> = ({ filled, className, ...props }) => {
  return <Heart fill={filled ? 'currentColor' : 'none'} className={className} {...props} />;
};