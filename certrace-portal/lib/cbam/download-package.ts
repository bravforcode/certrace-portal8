import { flushAccount, refreshAccountRecords } from "../account-storage";
import { assertSessionUnchanged, sessionEpoch } from "../api/session";
import { installationForWorkspace } from "../installations";
import { signOffState } from "../pack-signoff";
import { accountLocked, currentPlan } from "../plan";
import { listWorkspaces } from "../workspace";
import { evidenceFilesForPackage } from "./package-evidence";
import {
  documentsInPackage,
  packageStatus,
  reportsInPackage,
} from "./package-status";
import { reportPackageFileName } from "./report-set";
import { downloadReportPackage } from "./report-set-pdf";

/** Both export screens rebuild from acknowledged account data at click time. */
export async function downloadInstallationPackage(
  installationId: string,
  year: number,
) {
  const epoch = sessionEpoch();
  await flushAccount();
  await refreshAccountRecords();
  assertSessionUnchanged(epoch);
  if (accountLocked())
    throw new Error("Your trial has ended. Open Plan & billing to continue.");

  const workspaces = listWorkspaces().filter(
    (w) => w.installationId === installationId && w.year === year,
  );
  if (!workspaces.length)
    throw new Error(
      "No active product reports remain for this installation and year.",
    );
  const installation = installationForWorkspace(workspaces[0]);
  const status = packageStatus({ installation, workspaces, year });
  if (!status.packageReady)
    throw new Error(
      "The reports have changed or are incomplete. Review readiness before downloading.",
    );
  const sign = signOffState(status.signKey, status.ready, status.fingerprint);
  const methodologyLocked = !currentPlan().features.methodologyDoc;
  const documents = documentsInPackage(status.set, methodologyLocked);
  const fileName = reportPackageFileName(installation, year);
  const generatedAt = new Date();
  const extraFiles = await evidenceFilesForPackage(workspaces, year);
  assertSessionUnchanged(epoch);
  await downloadReportPackage(
    documents,
    {
      installation,
      year,
      generatedAt,
      extraFiles,
      signedBy:
        sign.kind === "signed"
          ? `${sign.signOff.name}, ${sign.signOff.jobTitle}`
          : undefined,
    },
    fileName,
  );
  return {
    fileName,
    reports: reportsInPackage(status.set, methodologyLocked).length,
    documents: documents.length,
    files: extraFiles.length,
  };
}
