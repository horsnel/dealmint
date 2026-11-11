import { Link } from 'react-router-dom';
import {
  Briefcase,
  ClipboardList,
  FileText,
  Download,
  Wrench,
  ChevronRight,
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { modesOf } from '@/lib/modes';
import type { User } from '@/types';

// The five posting flows (mirrors the header "Post" dropdown), each tagged
// with the provider modes it resonates with — mode matching only reorders
// the sheet, nothing is ever hidden (preference, not permission).
const POST_OPTIONS = [
  {
    name: 'Post a Task',
    href: '/post/task',
    icon: ClipboardList,
    circle: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    for: ['hire'] as const,
  },
  {
    name: 'Post a Gig',
    href: '/post/gig',
    icon: Briefcase,
    circle: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    for: ['seller'] as const,
  },
  {
    name: 'Post a Job',
    href: '/post/job',
    icon: FileText,
    circle: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
    for: ['hire'] as const,
  },
  {
    name: 'Offer a Service',
    href: '/post/service',
    icon: Wrench,
    circle: 'bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300',
    for: ['freelancer'] as const,
  },
  {
    name: 'Sell Digital',
    href: '/post/digital',
    icon: Download,
    circle: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300',
    for: ['seller'] as const,
  },
];

interface PostNewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

export function PostNewSheet({ open, onOpenChange, user }: PostNewSheetProps) {
  const myModes = modesOf(user);

  // Options relevant to the user's modes float to the top of the list.
  const options = [...POST_OPTIONS].sort(
    (a, b) =>
      (b.for.some((m) => myModes.includes(m)) ? 1 : 0) -
      (a.for.some((m) => myModes.includes(m)) ? 1 : 0)
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-md rounded-t-3xl dark:bg-violet-900">
        <DrawerHeader className="pb-2 text-left">
          <DrawerTitle className="font-display text-gray-900 dark:text-white">Post new</DrawerTitle>
          <DrawerDescription className="text-gray-500 dark:text-gray-400">
            Choose what you want to create
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-1">
          {options.map((option) => (
            <Link
              key={option.href}
              to={option.href}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-violet-800 transition-colors active:bg-gray-100 dark:active:bg-violet-800"
            >
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${option.circle}`}
              >
                <option.icon className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">{option.name}</span>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-violet-700 shrink-0" />
            </Link>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
