"use client";

/* Kebab (⋯) menu for a declaration — one shared control for the index cards,
   the table rows and the detail-page header, so the same actions live in the
   same place everywhere: Duplicate as draft · Copy link · Delete.
   Delete arms on first click and only fires on the second — no browser
   confirm() popup, no accidental loss. */

import * as React from "react";
import { useRouter } from "next/navigation";
import { EllipsisVertical, Copy, Link2, Trash2, Check } from "lucide-react";
import { cn } from "./ui";
import { Dropdown } from "./controls";
import { toast } from "./toast";
import type { Declaration } from "@/lib/data";
import { duplicateToDraft } from "@/lib/duplicate";
import { deleteDeclaration } from "@/lib/declarations-store";

function MenuItems({ decl, close, afterDelete }: { decl: Declaration; close: () => void; afterDelete?: () => void }) {
  const router = useRouter();
  const [armed, setArmed] = React.useState(false);
  const item = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12.5px] text-black/65 transition-colors hover:bg-[#fafaf8] hover:text-black";

  const duplicate = () => {
    const id = duplicateToDraft(decl);
    toast({ message: "Duplicated as a draft", detail: "Scope and suppliers copied — adjust the period and quantities.", tone: "ok" });
    close();
    router.push(`/declarations/new?draft=${id}`);
  };

  const copyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/declarations/${decl.id}`);
    }
    toast({ message: "Link copied", detail: "Anyone on your team with a seat can open it.", tone: "info" });
    close();
  };

  const del = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    deleteDeclaration(decl.id);
    toast({ message: "Declaration deleted", detail: "Supplier submissions stay on their own record.", tone: "info" });
    close();
    afterDelete?.();
  };

  return (
    <div>
      <button onClick={duplicate} className={item}>
        <Copy size={13} strokeWidth={1.5} className="flex-none text-black/40" /> Duplicate as draft
      </button>
      <button onClick={copyLink} className={item}>
        <Link2 size={13} strokeWidth={1.5} className="flex-none text-black/40" /> Copy link
      </button>
      <div className="mx-2 my-1 h-px bg-black/[0.06]" />
      <button onClick={del} className={cn(item, "text-[#dc2626] hover:bg-[#fef2f2] hover:text-[#dc2626]")}>
        {armed ? <Check size={13} strokeWidth={2} className="flex-none" /> : <Trash2 size={13} strokeWidth={1.5} className="flex-none" />}
        {armed ? "Click again to confirm" : "Delete declaration"}
      </button>
    </div>
  );
}

export function DeclarationMenu({
  decl,
  afterDelete,
  size = "md",
  className,
}: {
  decl: Declaration;
  afterDelete?: () => void;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <Dropdown
      align="right"
      className={className}
      trigger={(open) => (
        <span
          role="presentation"
          aria-label={`Actions for ${decl.title ?? decl.name}`}
          title="More actions"
          className={cn(
            "grid place-items-center rounded-lg transition-colors",
            size === "sm" ? "h-7 w-7" : "h-9 w-9 rounded-xl border",
            open
              ? size === "sm"
                ? "bg-black/[0.06] text-black"
                : "border-black/25 bg-black/[0.04] text-black"
              : size === "sm"
                ? "text-black/30 hover:bg-black/[0.05] hover:text-black"
                : "border-black/10 text-black/45 hover:border-black/25 hover:text-black",
          )}
        >
          <EllipsisVertical size={size === "sm" ? 14 : 15} strokeWidth={1.5} />
        </span>
      )}
    >
      {(close) => <MenuItems decl={decl} close={close} afterDelete={afterDelete} />}
    </Dropdown>
  );
}
