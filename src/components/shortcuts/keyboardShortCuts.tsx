'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard, Command } from 'lucide-react';

const shortcuts = [
  { key: '⌘ K', description: 'Open command palette' },
  { key: '⌘ /', description: 'Show keyboard shortcuts' },
  { key: 'G then D', description: 'Go to dashboard' },
  { key: 'G then N', description: 'New meeting' },
  { key: 'G then P', description: 'Go to productivity' },
  { key: 'Esc', description: 'Close modal / Clear input' },
  { key: 'Enter', description: 'Submit query' },
];

export function KeyboardShortcuts() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Keyboard className="w-4 h-4 mr-2" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {shortcuts.map((shortcut) => (
            <div 
              key={shortcut.key}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <span className="text-muted-foreground">
                {shortcut.description}
              </span>
              <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}