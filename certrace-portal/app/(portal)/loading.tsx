/* Shown inside the portal shell while a route's server or client code loads, so a tab switch
   shows structure at once instead of the previous page sitting unchanged. */
export default function PortalLoading() {
  return (
    <div
      className="space-y-4 motion-reduce:animate-none"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading</span>
      <div className="h-8 w-56 rounded-md bg-black/[0.04] animate-pulse motion-reduce:animate-none" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-black/5 bg-white p-4"
          >
            <div className="h-3 w-24 rounded bg-black/[0.04] animate-pulse motion-reduce:animate-none" />
            <div className="mt-4 h-7 w-32 rounded bg-black/[0.04] animate-pulse motion-reduce:animate-none" />
          </div>
        ))}
      </div>
      <div className="h-72 rounded-xl border border-black/5 bg-white p-4">
        <div className="h-4 w-40 rounded bg-black/[0.04] animate-pulse motion-reduce:animate-none" />
        <div className="mt-4 h-full rounded bg-black/[0.03] animate-pulse motion-reduce:animate-none" />
      </div>
    </div>
  );
}
