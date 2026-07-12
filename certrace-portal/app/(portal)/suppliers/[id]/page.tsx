"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { SupplierDetail } from "@/components/supplier-detail";
import { getSupplierProfile } from "@/lib/data";

export const runtime = "edge";

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [profile, setProfile] = React.useState(() => getSupplierProfile(id));

  React.useEffect(() => {
    if (profile) return;
    const found = getSupplierProfile(id);
    if (found) {
      setProfile(found);
    } else {
      router.replace("/suppliers");
    }
  }, [id, profile, router]);

  if (!profile) return null;
  return <SupplierDetail profile={profile} />;
}

