import { notFound } from "next/navigation";
import { DeclarationWorkflow } from "@/components/declaration-workflow";
import { getDeclaration } from "@/lib/data";

export default async function DeclarationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const declaration = getDeclaration(id);
  if (!declaration) notFound();
  return <DeclarationWorkflow declaration={declaration} />;
}
