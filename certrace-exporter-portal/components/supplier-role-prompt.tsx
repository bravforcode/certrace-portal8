"use client";

/* ════════════════════════════════════════════════════════════
   "ARE YOU A SUPPLIER TOO?"

   Asked once, the first time an exporter goes to add a supplier.

   The reason to ask HERE rather than in Settings is that this is the moment
   the question is live: somebody about to invite a third party to fill in
   production data is, quite often, about to invite themselves — because they
   own the mill. Getting a "no" is cheap and gets out of the way permanently;
   getting a "yes" saves them from creating a supplier record for their own
   company and then wondering why the emails bounce back to their own inbox.

   The answer is remembered, so it is one question and not a recurring one.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Modal } from "@/components/ui";
import { InstallationModal } from "@/components/workspace/installation-form";
import { emptyInstallation, hasOwnInstallation, saveInstallation } from "@/lib/installations";
import { useT } from "@/lib/i18n";

const ANSWERED_KEY = "certrace:supplier-role-answered";

export const hasAnsweredSupplierRole = (): boolean => {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(ANSWERED_KEY) === "1" || hasOwnInstallation();
};

const markAnswered = () => {
  try {
    window.localStorage.setItem(ANSWERED_KEY, "1");
  } catch {
    /* ignore quota */
  }
};

export function SupplierRolePrompt({
  open,
  onClose,
  /** called when the exporter says no — carry on to the invite form */
  onDeclined,
}: {
  open: boolean;
  onClose: () => void;
  onDeclined: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const [registering, setRegistering] = React.useState(false);

  const no = () => {
    markAnswered();
    onClose();
    onDeclined();
  };

  const yes = () => {
    markAnswered();
    setRegistering(true);
  };

  return (
    <>
      <Modal
        open={open && !registering}
        onClose={no}
        eyebrow={t("Before you invite anyone")}
        title={t("Are you a supplier as well?")}
        lead={t("Many exporters produce the good themselves. If your own company operates the installation, you do not invite a supplier — the data comes to you.")}
        width="max-w-lg"
        footer={
          <>
            <Button size="sm" variant="secondary" onClick={no}>
              {t("No — I buy from others")}
            </Button>
            <Button size="sm" onClick={yes}>
              {t("Yes — we produce it ourselves")}
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-black/55">
          {t("Answering yes registers your own installation and switches you to the supplier side of the portal, where the monthly requests for your own site are waiting. You can still invite third-party suppliers afterwards — most exporters do both.")}
        </p>
      </Modal>

      <InstallationModal
        open={registering}
        onClose={() => {
          setRegistering(false);
          onClose();
        }}
        initial={emptyInstallation(true)}
        allowSelfToggle={false}
        title={t("Register your installation")}
        lead={t("Your own site is the installation a verifier will scope against. Register it once and every workspace reuses it.")}
        onSaved={(saved) => {
          saveInstallation({ ...saved, self: true });
          setRegistering(false);
          onClose();
          router.push("/smart-links");
        }}
      />
    </>
  );
}
