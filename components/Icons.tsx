import React from 'react';
import type { LucideProps } from 'lucide-react';
// FIX: Import 'Star' and 'Heart' to create custom fillable icon components.
import { Play, Pause, Star, Heart, Download, Check, List } from 'lucide-react';

// FIX: Added missing icons to the export list.
export {
  Upload as UploadIcon,
  BookOpen as BookOpenIcon,
  Mic as MicIcon,
  BookMarked as BookMarkedIcon,
  ChevronLeft as ChevronLeftIcon,
  X as XIcon,
  Settings as SettingsIcon,
  SkipBack as SkipBackIcon,
  SkipForward as SkipForwardIcon,
  Type as TypeIcon,
  Palette as PaletteIcon,
  Edit as EditIcon,
  Trash as TrashIcon,
  MessageSquare as MessageSquareIcon,
  Award as AwardIcon,
  Clock as ClockIcon,
  Zap as ZapIcon,
  Sparkles as SparklesIcon,
  Plus as PlusIcon,
  Download as DownloadIcon,
  Check as CheckIcon,
  Users as UsersIcon,
  List as ListIcon,
} from 'lucide-react';

export const PlayIcon: React.FC<LucideProps> = (props) => <Play fill="currentColor" {...props} />;
export const PauseIcon: React.FC<LucideProps> = (props) => <Pause fill="currentColor" {...props} />;

// FIX: Created a shared interface for icons that support a 'filled' state.
// By using a type alias for an intersection, we ensure that all properties from
// LucideProps (including `className`) are correctly included in the component's props.
type FillableIconProps = LucideProps & {
  filled?: boolean;
};

// FIX: Switched from React.FC to a plain function component to fix prop type inference for `className`.
export const StarIcon = ({ filled, ...props }: FillableIconProps) => (
    <Star fill={filled ? 'currentColor' : 'none'} {...props} />
);

// FIX: Switched from React.FC to a plain function component to fix prop type inference for `className`.
export const HeartIcon = ({ filled, ...props }: FillableIconProps) => (
    <Heart fill={filled ? 'currentColor' : 'none'} {...props} />
);