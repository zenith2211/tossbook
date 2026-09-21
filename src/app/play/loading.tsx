/** Instant shell shown while a player screen's data loads. */
export default function PlayLoading() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-40 rounded-2xl" />
      <div className="skeleton mx-auto h-11 w-56 rounded-full" />
      <div className="skeleton h-72 rounded-2xl" />
      <div className="skeleton h-72 rounded-2xl" />
    </div>
  );
}
