"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type PaymentState =
  | "checking"
  | "paid"
  | "pending"
  | "error";

export default function DocumentRequestCompletePage() {
  const [paymentState, setPaymentState] =
    useState<PaymentState>("checking");

  const [message, setMessage] = useState(
    "Confirming your payment..."
  );

  const [requestId, setRequestId] =
    useState("");

  const [downloading, setDownloading] =
    useState(false);

  const [manualChecking, setManualChecking] =
    useState(false);

  const checkPaymentOnce = async (
    id: string
  ) => {
    const response = await fetch(
      `/api/document-request/status?requestId=${encodeURIComponent(
        id
      )}`,
      {
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.error ||
          "Unable to confirm payment."
      );
    }

    return (
      result.request?.payment_status ===
      "paid"
    );
  };

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const requestIdFromUrl =
      params.get("requestId");

    if (!requestIdFromUrl) {
      setPaymentState("error");
      setMessage(
        "We could not identify this document request."
      );
      return;
    }

    setRequestId(requestIdFromUrl);

    let attempts = 0;
    const maxAttempts = 30;

    let timer:
      | ReturnType<typeof setInterval>
      | undefined;

    const checkPayment = async () => {
      try {
        attempts += 1;

        const paid =
          await checkPaymentOnce(
            requestIdFromUrl
          );

        if (paid) {
          setPaymentState("paid");
          setMessage(
            "Payment confirmed."
          );

          localStorage.removeItem(
            "mydnr-document-request"
          );

          return true;
        }

        if (attempts >= maxAttempts) {
          setPaymentState("pending");
          setMessage(
            "Your payment is still being confirmed."
          );

          return true;
        }

        return false;
      } catch (error) {
        console.error(
          "DOCUMENT PAYMENT STATUS ERROR:",
          error
        );

        if (attempts >= maxAttempts) {
          setPaymentState("error");
          setMessage(
            "We could not confirm your payment at this time."
          );

          return true;
        }

        return false;
      }
    };

    const startChecking = async () => {
      const finished =
        await checkPayment();

      if (finished) {
        return;
      }

      timer = setInterval(
        async () => {
          const done =
            await checkPayment();

          if (done && timer) {
            clearInterval(timer);
          }
        },
        2000
      );
    };

    startChecking();

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, []);

  const handleCheckAgain = async () => {
    if (!requestId) {
      setPaymentState("error");
      setMessage(
        "We could not identify this document request."
      );
      return;
    }

    try {
      setManualChecking(true);
      setPaymentState("checking");
      setMessage(
        "Checking your payment again..."
      );

      const paid =
        await checkPaymentOnce(requestId);

      if (paid) {
        setPaymentState("paid");
        setMessage(
          "Payment confirmed."
        );

        localStorage.removeItem(
          "mydnr-document-request"
        );

        return;
      }

      setPaymentState("pending");
      setMessage(
        "Your payment is still being confirmed."
      );
    } catch (error) {
      console.error(
        "MANUAL DOCUMENT PAYMENT STATUS ERROR:",
        error
      );

      setPaymentState("error");
      setMessage(
        "We could not confirm your payment at this time."
      );
    } finally {
      setManualChecking(false);
    }
  };

  const handleDownload = async () => {
    if (!requestId) {
      alert(
        "Document request ID could not be found."
      );
      return;
    }

    /*
     * Open the tab immediately while the browser
     * still considers this a direct user action.
     */
    const documentWindow = window.open(
      "",
      "_blank"
    );

    if (!documentWindow) {
      alert(
        "Your browser blocked the document window. Please allow pop-ups for MyDNR and try again."
      );
      return;
    }

    try {
      setDownloading(true);

      documentWindow.document.write(`
        <html>
          <head>
            <title>MyDNR - Preparing Document</title>
          </head>
          <body style="
            margin: 0;
            font-family: Arial, sans-serif;
            background: #f5f9fd;
            color: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
          ">
            <div style="
              max-width: 520px;
              padding: 32px;
            ">
              <div style="
                width: 64px;
                height: 64px;
                margin: 0 auto 24px;
                border-radius: 50%;
                background: #dbeafe;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #2563eb;
                font-size: 28px;
                font-weight: bold;
              ">
                ↓
              </div>

              <h2 style="
                margin-bottom: 12px;
                font-size: 24px;
              ">
                Preparing your secure DNR document...
              </h2>

              <p style="
                color: #64748b;
                line-height: 1.6;
              ">
                Please wait a moment while MyDNR prepares
                your temporary secure document link.
              </p>
            </div>
          </body>
        </html>
      `);

      const response = await fetch(
        `/api/document-request/download?requestId=${encodeURIComponent(
          requestId
        )}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Unable to prepare document download."
        );
      }

      if (!result.signedUrl) {
        throw new Error(
          "Secure document link was not returned."
        );
      }

      documentWindow.location.href =
        result.signedUrl;

    } catch (error: any) {
      console.error(
        "DOCUMENT DOWNLOAD ERROR:",
        error
      );

      documentWindow.close();

      alert(
        error?.message ||
          "Unable to retrieve the DNR document."
      );
    } finally {
      setDownloading(false);
    }
  };

  /* =====================================================
     PAYMENT CHECKING / PENDING / ERROR
  ===================================================== */

  if (paymentState !== "paid") {
    return (
      <main className="min-h-screen bg-[#f5f9fd] text-slate-950">

        {/* HEADER */}
        <header className="border-b border-blue-100 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">

            <Link
              href="/"
              aria-label="Back to MyDNR home"
            >
              <Image
                src="/images/mydnr-logo.png"
                alt="MyDNR South Africa"
                width={72}
                height={72}
                className="h-auto w-[54px] sm:w-[62px]"
                priority
              />
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Back to MyDNR
            </Link>

          </div>
        </header>

        {/* PAGE INTRO */}
        <section className="border-b border-blue-100 bg-[#eef6fd]">
          <div className="mx-auto max-w-4xl px-5 py-10 text-center sm:px-8 sm:py-14">

            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-blue-600">
              Secure Document Retrieval
            </p>

            <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
              Confirming Your Payment
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              {message}
            </p>

          </div>
        </section>

        {/* MAIN CONTENT */}
        <section className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">

          <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)]">

            <div className="px-6 py-9 text-center sm:px-9 sm:py-11">

              {/* CHECKING */}
              {paymentState === "checking" && (
                <>
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                  </div>

                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                    Payment Confirmation
                  </p>

                  <h2 className="mt-3 text-2xl font-bold text-slate-950">
                    Just a moment
                  </h2>

                  <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
                    Please wait while MyDNR confirms your
                    R100 document retrieval payment with
                    PayFast. This normally only takes a few
                    moments.
                  </p>

                  <div className="mx-auto mt-7 max-w-xl rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                    <p className="text-sm leading-6 text-slate-600">
                      Please do not refresh or close this page
                      while payment confirmation is in progress.
                    </p>
                  </div>
                </>
              )}

              {/* PENDING */}
              {paymentState === "pending" && (
                <>
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                    <span className="text-3xl font-bold text-blue-600">
                      i
                    </span>
                  </div>

                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                    Confirmation Pending
                  </p>

                  <h2 className="mt-3 text-2xl font-bold text-slate-950">
                    Payment Confirmation Is Taking Longer Than Expected
                  </h2>

                  <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
                    Your payment notification has not yet
                    reached MyDNR.
                  </p>

                  <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">

                    <p className="font-bold text-slate-900">
                      Please do not make another payment.
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      If you completed your payment with
                      PayFast, it may simply still be
                      processing. You can safely check the
                      payment status again below.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={handleCheckAgain}
                    disabled={manualChecking}
                    className="mt-7 w-full rounded-xl bg-blue-600 px-8 py-4 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {manualChecking
                      ? "Checking Payment..."
                      : "Check Payment Again"}
                  </button>
                </>
              )}

              {/* ERROR */}
              {paymentState === "error" && (
                <>
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                    <span className="text-3xl font-bold text-blue-600">
                      i
                    </span>
                  </div>

                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                    Confirmation Unavailable
                  </p>

                  <h2 className="mt-3 text-2xl font-bold text-slate-950">
                    We Couldn&apos;t Confirm Your Payment Yet
                  </h2>

                  <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
                    MyDNR was unable to confirm your payment
                    at this time.
                  </p>

                  <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">

                    <p className="font-bold text-slate-900">
                      If you have already paid, please do not
                      make another payment.
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      You can safely try checking the payment
                      status again below.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={handleCheckAgain}
                    disabled={manualChecking}
                    className="mt-7 w-full rounded-xl bg-blue-600 px-8 py-4 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {manualChecking
                      ? "Checking Payment..."
                      : "Check Payment Again"}
                  </button>
                </>
              )}

            </div>
          </div>

          {paymentState !== "checking" && (
            <Link
              href="/"
              className="mt-5 block w-full rounded-xl border border-blue-200 bg-white py-4 text-center font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Return to MyDNR Home
            </Link>
          )}

        </section>

        {/* REASSURANCE */}
        <section className="mt-auto border-t border-blue-100 bg-[#eef6fd]">
          <div className="mx-auto grid max-w-4xl gap-5 px-5 py-8 sm:grid-cols-3 sm:px-8">

            <div className="text-center">
              <div className="text-lg text-blue-600">
                ✓
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Secure payment
              </p>
            </div>

            <div className="text-center">
              <div className="text-lg text-blue-600">
                ✓
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Audit recorded
              </p>
            </div>

            <div className="text-center">
              <div className="text-lg text-blue-600">
                ✓
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Protected retrieval
              </p>
            </div>

          </div>
        </section>

      </main>
    );
  }

  /* =====================================================
     PAYMENT CONFIRMED / DOCUMENT READY
  ===================================================== */

  return (
    <main className="min-h-screen bg-[#f5f9fd] text-slate-950">

      {/* HEADER */}
      <header className="border-b border-blue-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">

          <Link
            href="/"
            aria-label="Back to MyDNR home"
          >
            <Image
              src="/images/mydnr-logo.png"
              alt="MyDNR South Africa"
              width={72}
              height={72}
              className="h-auto w-[54px] sm:w-[62px]"
              priority
            />
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Back to MyDNR
          </Link>

        </div>
      </header>

      {/* SUCCESS INTRO */}
      <section className="border-b border-blue-100 bg-[#eef6fd]">
        <div className="mx-auto max-w-4xl px-5 py-10 text-center sm:px-8 sm:py-14">

          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white shadow-md">
            ✓
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-blue-600">
            Payment Confirmed
          </p>

          <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            Your DNR Document Is Ready
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Your R100 retrieval payment has been successfully
            confirmed and secure access to the registered DNR
            document is now available.
          </p>

        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">

        <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)]">

          {/* DOCUMENT READY */}
          <div className="border-b border-blue-100 bg-[#f8fbff] px-6 py-8 text-center sm:px-9 sm:py-9">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-bold text-blue-700">
              ↓
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
              Secure Document Access
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              View the Registered DNR Document
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
              Payment has been confirmed and the registered
              DNR document is ready for secure retrieval.
            </p>

          </div>

          <div className="space-y-8 px-6 py-8 sm:px-9 sm:py-10">

            {/* DOWNLOAD */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-6 text-center sm:p-8">

              <p className="text-sm leading-6 text-slate-600">
                When you continue, MyDNR will prepare a
                temporary secure link to the registered
                DNR document.
              </p>

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloading
                  ? "Preparing Secure Document..."
                  : "View Registered DNR Document"}
              </button>

              <div className="mt-5 flex items-start justify-center gap-2 text-left sm:text-center">

                <span className="shrink-0 text-blue-600">
                  ✓
                </span>

                <p className="text-xs leading-5 text-slate-500">
                  For your security, access to this document
                  is temporary. You may view or download a
                  copy while the secure link is active.
                </p>

              </div>

            </div>

            {/* COMPLETED ITEMS */}
            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Retrieval Status
              </p>

              <h3 className="mt-2 text-xl font-bold text-slate-950">
                Your document request is ready.
              </h3>

              <div className="mt-6 space-y-4">

                <StatusItem>
                  Your payment has been successfully confirmed.
                </StatusItem>

                <StatusItem>
                  Your document request has been recorded.
                </StatusItem>

                <StatusItem>
                  The retrieval request is linked to the
                  registered DNR record.
                </StatusItem>

                <StatusItem>
                  Secure access to the registered DNR document
                  is now available.
                </StatusItem>

              </div>

            </div>

            {/* SECURITY NOTICE */}
            <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-6 sm:p-7">

              <div className="flex items-start gap-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
                  i
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    Security Notice
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                    MyDNR records document retrieval requests
                    for audit and security purposes. Only the
                    registered DNR document is made available
                    through this retrieval process.
                    Identification documents are never provided
                    through this service.
                  </p>
                </div>

              </div>

            </div>

            {/* HOME */}
            <div className="border-t border-blue-100 pt-7">

              <Link
                href="/"
                className="block w-full rounded-xl border border-blue-200 bg-white py-4 text-center font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Return to MyDNR Home
              </Link>

            </div>

          </div>
        </div>
      </section>

      {/* REASSURANCE */}
      <section className="border-t border-blue-100 bg-[#eef6fd]">

        <div className="mx-auto grid max-w-4xl gap-5 px-5 py-8 sm:grid-cols-3 sm:px-8">

          <div className="text-center">
            <div className="text-lg text-blue-600">
              ✓
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              Temporary access
            </p>
          </div>

          <div className="text-center">
            <div className="text-lg text-blue-600">
              ✓
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              Audit recorded
            </p>
          </div>

          <div className="text-center">
            <div className="text-lg text-blue-600">
              ✓
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              DNR document only
            </p>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-blue-100 bg-white">

        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">

            <Image
              src="/images/mydnr-logo.png"
              alt="MyDNR"
              width={48}
              height={48}
              className="h-auto w-[38px]"
            />

            <p className="text-sm text-slate-500">
              Secure DNR registration &amp; retrieval.
            </p>

          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-500">

            <Link
              href="/privacy"
              className="hover:text-blue-700"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="hover:text-blue-700"
            >
              Terms
            </Link>

            <Link
              href="/disclaimer"
              className="hover:text-blue-700"
            >
              Disclaimer
            </Link>

            <Link
              href="/contact"
              className="hover:text-blue-700"
            >
              Contact
            </Link>

            <Link
              href="/about"
              className="hover:text-blue-700"
            >
              About
            </Link>

          </nav>

        </div>
      </footer>

    </main>
  );
}

function StatusItem({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">

      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600">
        <span className="text-sm font-bold text-white">
          ✓
        </span>
      </div>

      <p className="leading-7 text-slate-600">
        {children}
      </p>

    </div>
  );
}