import type { InputReferenceId } from "@/lib/verification-input-references";

/** A stable reference beside the label; names and translations stay intact. */
export function InputReference({ id }: { id?: InputReferenceId }) {
  if (!id) return null;
  return (
    <span
      aria-hidden="true"
      data-input-ref={id}
      className="inline-block shrink-0 rounded border border-current bg-black/[0.035] px-1.5 py-0.5 align-middle font-mono text-[10px] font-normal leading-none tracking-normal text-inherit opacity-60"
    >
      {id}
    </span>
  );
}
