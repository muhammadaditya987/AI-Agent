export default function DashboardLoading() {
  return (
    <div className="space-y-8" aria-label="Loading dashboard">
      <div className="space-y-3 border-b border-border pb-7"><div className="h-3 w-24 animate-pulse bg-muted" /><div className="h-10 w-2/3 animate-pulse bg-muted" /><div className="h-4 w-1/2 animate-pulse bg-muted" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-38.5 animate-pulse border border-border bg-muted" />)}</div>
      <div className="h-64 animate-pulse border border-border bg-muted" />
    </div>
  );
}