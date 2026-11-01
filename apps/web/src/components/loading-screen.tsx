import { LoaderCircle } from 'lucide-react';

export function LoadingScreen({ label = 'Loading workspace' }: Readonly<{ label?: string }>) {
  return (
    <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
      <div className="flex items-center gap-3 text-sm">
        <LoaderCircle className="size-5 animate-spin text-teal-700" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}