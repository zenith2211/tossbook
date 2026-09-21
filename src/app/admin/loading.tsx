import { SkeletonRows } from "@/components/admin/kit";

/** Instant shell shown while an admin section's data loads. */
export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <section className="card-shadow rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <div className="skeleton h-5 w-36 rounded-full" />
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-[74px] rounded-2xl" />
          ))}
        </div>
        <div className="skeleton mt-4 h-11 w-full rounded-xl" />
      </section>
      <SkeletonRows rows={3} />
    </div>
  );
}
