import { redirect } from "next/navigation";

export default async function LegacyInstallationPage({
  params,
}: {
  params: Promise<{ installationId: string; year?: string }>;
}) {
  const { installationId, year } = await params;
  redirect(
    `/workspaces/installation/${encodeURIComponent(installationId)}${year ? `?year=${encodeURIComponent(year)}` : ""}`,
  );
}
