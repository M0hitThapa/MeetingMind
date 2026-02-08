'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Plus,
  LayoutDashboard,
  Mic,
  Settings,
  Moon,
  Sun,
  Search,

  Zap,
  Brain
} from 'lucide-react';
import { useTheme } from 'next-themes';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (cmd: () => void) => {
    setOpen(false);
    cmd();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/dashboard'))}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Go to Dashboard
            <span className="ml-auto text-xs text-muted-foreground">G D</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/upload'))}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Meeting
            <span className="ml-auto text-xs text-muted-foreground">G N</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/productivity'))}
          >
            <Zap className="mr-2 h-4 w-4" />
            Productivity Hub
            <span className="ml-auto text-xs text-muted-foreground">G P</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/upload'))}
          >
            <Mic className="mr-2 h-4 w-4" />
            Upload Recording
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => {
              const newTheme = theme === 'dark' ? 'light' : 'dark';
              setTheme(newTheme);
            })}
          >
            {theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Toggle Theme
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Tools">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/search'))}
          >
            <Search className="mr-2 h-4 w-4" />
            Search Meetings
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/flashcards'))}
          >
            <Brain className="mr-2 h-4 w-4" />
            Study Flashcards
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/settings'))}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}