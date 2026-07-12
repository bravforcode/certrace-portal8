"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DeclarationWorkflow } from "@/components/declaration-workflow";
import { getDeclaration, type Declaration } from "@/lib/data";

export const runtime = "edge";

export default function DeclarationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [declaration, setDeclaration] = React.useState<Declaration | null>(() => getDeclaration(id) ?? null);

  React.useEffect(() => {
    if (declaration) return;
    const found = getDeclaration(id);
    if (found) {
      setDeclaration(found);
    } else {
      router.replace("/declarations");
    }
  }, [id, declaration, router]);

  if (!declaration) return null;
  return <DeclarationWorkflow declaration={declaration} />;
}
