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

    // Open the tab immediately while the browser still
    // considers this a direct user action.
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
            background: #ffffff;
            color: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
          ">
            <div>
              <h2>Preparing your secure DNR document...</h2>
              <p>Please wait a moment.</p>
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

  if (paymentState !== "paid") {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-6 py-12">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/images/mydnr-logo.png"
              alt="MyDNR South Africa"
              width={330}
              height={330}
              style={{
                width: "auto",
                height: "auto",
              }}
              priority
            />
          </div>

          <div className="text-center mb-10">

            {/* Active Spinner */}
            {paymentState === "checking" && (
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                </div>
              </div>
            )}

            {/* Pending / Error Icon */}
            {paymentState !== "checking" && (
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-4xl text-slate-700">
                    …
                  </span>
                </div>
              </div>
            )}

            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Confirming Payment
            </h1>

            <p className="text-slate-600">
              {message}
            </p>

          </div>

          <div className="bg-slate-50 rounded-3xl p-8 mb-8 text-center">

            {paymentState === "checking" && (
              <p className="text-slate-600 leading-relaxed">
                Please wait while MyDNR confirms your
                payment with PayFast. This normally only
                takes a few moments.
              </p>
            )}

            {paymentState === "pending" && (
              <>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Your payment notification has not yet
                  reached MyDNR. Please do not make another
                  payment. If you completed the PayFast
                  payment, you can check again below.
                </p>

                <button
                  onClick={handleCheckAgain}
                  disabled={manualChecking}
                  className="inline-block bg-slate-900 text-white px-8 py-3 rounded-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {manualChecking
                    ? "Checking Payment..."
                    : "Check Payment Again"}
                </button>
              </>
            )}

            {paymentState === "error" && (
              <>
                <p className="text-slate-600 leading-relaxed mb-6">
                  We were unable to confirm your payment at
                  this time. If you completed the PayFast
                  payment, please do not make another payment.
                  You can try checking again below.
                </p>

                <button
                  onClick={handleCheckAgain}
                  disabled={manualChecking}
                  className="inline-block bg-slate-900 text-white px-8 py-3 rounded-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {manualChecking
                    ? "Checking Payment..."
                    : "Check Payment Again"}
                </button>
              </>
            )}

          </div>

          {/* Do not show this while actively checking */}
          {paymentState !== "checking" && (
            <Link
              href="/"
              className="block w-full border border-slate-300 text-slate-700 py-4 rounded-xl text-center font-medium"
            >
              Return Home
            </Link>
          )}

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/mydnr-logo.png"
            alt="MyDNR South Africa"
            width={330}
            height={330}
            style={{
              width: "auto",
              height: "auto",
            }}
            priority
          />
        </div>

        {/* Success Heading */}
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

        {/* Download Panel */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-8 text-center">

          <h2 className="text-2xl font-semibold text-slate-800 mb-5">
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
              : "View Registered DNR Document"}
          </button>

          <p className="text-sm text-slate-500 mt-4">
            For your security, access to this document is temporary.
            You may view or download a copy while the secure link is active.
          </p>

        </div>

        {/* Completed Items */}
        <div className="bg-slate-50 rounded-3xl p-6 mb-8">

          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            Your Document Request Is Ready
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

        {/* Security Notice */}
        <div className="bg-slate-50 rounded-3xl p-6 mb-8">

          <h3 className="text-xl font-semibold text-slate-800 mb-3">
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