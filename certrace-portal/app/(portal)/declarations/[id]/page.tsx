"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { DeclarationWorkflow } from "@/components/declaration-workflow";
import { getDeclaration, type Declaration } from "@/lib/data";

export const runtime = "edge";

export default function DeclarationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
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
