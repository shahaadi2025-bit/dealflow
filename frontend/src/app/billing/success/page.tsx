"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { setPro } from "@/lib/billing";

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<p className="text-dim py-20 text-center">Loading...</p>}>
      <BillingSuccessInner />
    </Suspense>
  );
}

function BillingSuccessInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ok" | "fail">("checking");

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (!sessionId) {
      setStatus("fail");
      return;
    }
    api.verifySession(sessionId)
      .then((r) => {
        if (r.paid) {
          setPro(true);
          setStatus("ok");
          setTimeout(() => router.push("/screener"), 1800);
        } else {
          setStatus("fail");
        }
      })
      .catch(() => setStatus("fail"));
  }, [params, router]);

  return (
    <div className="py-24 text-center">
      {status === "checking" && (
        <>
          <Loader2 size={28} className="text-dim animate-spin mx-auto mb-4" />
          <p className="text-dim text-[13px]">Confirming your payment...</p>
        </>
      )}
      {status === "ok" && (
        <>
          <CheckCircle2 size={28} className="text-up mx-auto mb-4" />
          <p className="text-ink text-[14px] mb-1">You&apos;re Pro now.</p>
          <p className="text-dim text-[12px]">Redirecting to the screener...</p>
        </>
      )}
      {status === "fail" && (
        <>
          <XCircle size={28} className="text-down mx-auto mb-4" />
          <p className="text-ink text-[14px] mb-1">Could not confirm payment.</p>
          <p className="text-dim text-[12px]">If you were charged, contact support - no access was granted here.</p>
        </>
      )}
    </div>
  );
}