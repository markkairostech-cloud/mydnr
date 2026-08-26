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
    const maxAttempts = 10;

    let timer:
      | ReturnType<typeof setInterval>
      | undefined;

    const checkPayment = async () => {
      try {
        attempts += 1;

        const response = await fetch(
          `/api/document-request/status?requestId=${encodeURIComponent(
            requestIdFromUrl
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

        if (
          result.request?.payment_status ===
          "paid"
        ) {
          setPaymentState("paid");
          setMessage("Payment confirmed.");

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

  const handleDownload = async () => {
    if (!requestId) {
      alert(
        "Document request ID could not be found."
      );
      return;
    }

    try {
      setDownloading(true);

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

      window.location.href =
        result.signedUrl;
    } catch (error: any) {
      console.error(
        "DOCUMENT DOWNLOAD ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to retrieve the DNR document."
      );
    } finally {
      setDownloading(false);
    }
  };

  if (paymentState !== "paid") {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <div className="flex justify-center mb-6">
            <Image
              src="/images/mydnr-logo.png"
              alt="MyDNR South Africa"
              width={300}
              height={300}
              priority
            />
          </div>

          <div className="text-center mb-10">

            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-4xl text-slate-700">
                  …
                </span>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Confirming Payment
            </h1>

            <p className="text-slate-600">
              {message}
            </p>

          </div>

          <div className="bg-slate-50 rounded-3xl p-10 mb-10 text-center">

            {paymentState === "checking" && (
              <p className="text-slate-600 leading-relaxed">
                Please wait while MyDNR confirms your
                payment with PayFast. This normally only
                takes a few moments.
              </p>
            )}

            {paymentState === "pending" && (
              <p className="text-slate-600 leading-relaxed">
                Your payment notification has not yet been
                received. Please do not make another payment.
                Your document request remains recorded while
                payment confirmation is completed.
              </p>
            )}

            {paymentState === "error" && (
              <p className="text-slate-600 leading-relaxed">
                We were unable to verify this payment at this
                time. Please do not make another payment if
                you believe the transaction was completed.
              </p>
            )}

          </div>

          <Link
            href="/"
            className="block w-full bg-slate-900 text-white py-4 rounded-xl text-center font-medium"
          >
            Return Home
          </Link>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">

        <div className="flex justify-center mb-6">
          <Image
            src="/images/mydnr-logo.png"
            alt="MyDNR South Africa"
            width={300}
            height={300}
            priority
          />
        </div>

        <div className="text-center mb-10">

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-5xl text-green-700">
                ✓
              </span>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Payment Confirmed
          </h1>

          <p className="text-slate-600">
            Your DNR document retrieval payment has been
            successfully confirmed.
          </p>

        </div>

        <div className="bg-slate-50 rounded-3xl p-10 mb-10 text-center">

          <h2 className="text-2xl font-semibold text-slate-800 mb-6">
            Your DNR Document Is Ready
          </h2>

          <p className="text-slate-600 leading-relaxed mb-6">
            Payment has been confirmed and the registered
            DNR document is ready for secure retrieval.
          </p>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloading
              ? "Preparing Secure Document..."
              : "Download Registered DNR Document"}
          </button>

          <p className="text-sm text-slate-500 mt-4">
            The secure document link is temporary and expires
            after a short period.
          </p>

        </div>

        <div className="bg-slate-50 rounded-3xl p-8 mb-10">

          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            What Happens Next?
          </h3>

          <ul className="space-y-3 text-slate-600">

            <li>
              ✓ Your payment has been successfully confirmed.
            </li>

            <li>
              ✓ Your document request has been recorded.
            </li>

            <li>
              ✓ The retrieval request is linked to the
              registered DNR record.
            </li>

            <li>
              ✓ Secure access to the registered DNR document
              is now available.
            </li>

          </ul>

        </div>

        <div className="bg-slate-50 rounded-3xl p-8 mb-10">

          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            Security Notice
          </h3>

          <p className="text-slate-600 leading-relaxed">
            MyDNR records document retrieval requests for
            audit and security purposes. Only the registered
            DNR document is made available through this
            retrieval process. Identification documents are
            never provided through this service.
          </p>

        </div>

        <Link
          href="/"
          className="block w-full bg-slate-900 text-white py-4 rounded-xl text-center font-medium"
        >
          Return Home
        </Link>

      </div>
    </main>
  );
}