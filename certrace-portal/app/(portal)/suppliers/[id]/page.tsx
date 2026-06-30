import { notFound } from "next/navigation";
import { SupplierDetail } from "@/components/supplier-detail";
import { getSupplierProfile } from "@/lib/data";

export const runtime = "edge";

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = getSupplierProfile(id);
  if (!profile) notFound();
  return <SupplierDetail profile={profile} />;
}
