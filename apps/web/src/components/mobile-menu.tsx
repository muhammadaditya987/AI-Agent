'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Sidebar } from './sidebar';
import { Button } from './ui/button';

export function MobileMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/40 md:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[min(84vw,300px)] outline-none md:hidden">
          <Dialog.Title className="sr-only">Main navigation</Dialog.Title>
          <Dialog.Description className="sr-only">Navigate the workspace</Dialog.Description>
          <Button className="absolute right-2 top-4 z-10" variant="ghost" size="icon" aria-label="Close navigation" onClick={() => onOpenChange(false)}>
            <X className="size-5" aria-hidden="true" />
          </Button>
          <Sidebar onNavigate={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}