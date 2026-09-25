"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useState,
} from "react";

type PaymentState =
  | "checking"
  | "paid"
  | "pending"
  | "error";

export default function RegistrationCompletePage() {
  return (
    <Suspense fallback={<CheckingPayment />}>
      <RegistrationCompleteContent />
    </Suspense>
  );
}

/* =========================================================
   SHARED LOGO
========================================================= */

function Logo() {
  return (
    <div className="flex justify-center mb-5 sm:mb-6">
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
  );
}

/* =========================================================
   PROCESSING INDICATOR
========================================================= */

function ProcessingIndicator() {
  return (
    <div className="flex justify-center mb-6">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
        <div className="absolute h-20 w-20 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
          <span className="text-white text-lg font-bold">
            ✓
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SUSPENSE FALLBACK
========================================================= */

function CheckingPayment() {
  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10 sm:py-14">

        <Logo />

        <div className="text-center mb-8 sm:mb-10">
          <ProcessingIndicator />

          <p className="text-sm font-semibold tracking-[0.2em] text-blue-600 uppercase mb-3">
            MyDNR South Africa
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mb-4">
            Confirming Your Registration
          </h1>

          <p className="text-slate-600">
            Confirming your payment...
          </p>
        </div>

        <div className="bg-white border border-blue-100 shadow-sm rounded-3xl p-7 sm:p-10 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-4">
            Just a moment
          </h2>

          <p className="text-slate-600 leading-relaxed">
            Please wait while MyDNR confirms your payment
            with PayFast. This normally only takes a few
            moments.
          </p>

          <p className="text-sm text-slate-500 mt-5">
            Please do not refresh or close this page while
            confirmation is in progress.
          </p>
        </div>

      </div>
    </main>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

function RegistrationCompleteContent() {
  const searchParams = useSearchParams();

  const registrationId =
    searchParams.get("registrationId");

  const [paymentState, setPaymentState] =
    useState<PaymentState>("checking");

  const [message, setMessage] = useState(
    "Confirming your payment..."
  );

  const [manualChecking, setManualChecking] =
    useState(false);

  /* =======================================================
     PAYMENT STATUS CHECK
  ======================================================= */

  const checkPaymentOnce = async () => {
    if (!registrationId) {
      throw new Error(
        "We could not identify this registration."
      );
    }

    const response = await fetch(
      `/api/register/status?registrationId=${encodeURIComponent(
        registrationId
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
      result.registration?.payment_status ===
      "paid"
    );
  };

  /* =======================================================
     AUTOMATIC PAYMENT CHECKING
  ======================================================= */

  useEffect(() => {
    if (!registrationId) {
      setPaymentState("error");
      setMessage(
        "We could not identify this registration."
      );
      return;
    }

    let attempts = 0;

    /*
     * Initial check + subsequent checks every 2 seconds
     * gives the PayFast notification roughly 60 seconds
     * to reach MyDNR.
     */
    const maxAttempts = 30;

    let timer:
      | ReturnType<typeof setInterval>
      | undefined;

    const checkPayment = async () => {
      try {
        attempts += 1;

        const paid =
          await checkPaymentOnce();

        if (paid) {
          setPaymentState("paid");
          setMessage(
            "Payment confirmed."
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
          "PAYMENT STATUS ERROR:",
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
  }, [registrationId]);

  /* =======================================================
     MANUAL PAYMENT RECHECK
  ======================================================= */

  const handleCheckAgain = async () => {
    try {
      setManualChecking(true);
      setPaymentState("checking");
      setMessage(
        "Checking your payment again..."
      );

      const paid =
        await checkPaymentOnce();

      if (paid) {
        setPaymentState("paid");
        setMessage(
          "Payment confirmed."
        );

        return;
      }

      setPaymentState("pending");
      setMessage(
        "Your payment is still being confirmed."
      );
    } catch (error) {
      console.error(
        "MANUAL PAYMENT STATUS ERROR:",
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

  /* =======================================================
     CHECKING / PENDING / ERROR
  ======================================================= */

  if (paymentState !== "paid") {
    return (
      <main className="min-h-screen bg-[#f5f9ff]">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10 sm:py-14">

          <Logo />

          <div className="text-center mb-8 sm:mb-10">

            {paymentState === "checking" ? (
              <ProcessingIndicator />
            ) : (
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                  <span className="text-3xl font-bold text-blue-600">
                    i
                  </span>
                </div>
              </div>
            )}

            <p className="text-sm font-semibold tracking-[0.2em] text-blue-600 uppercase mb-3">
              MyDNR South Africa
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mb-4">
              Confirming Your Registration
            </h1>

            <p className="text-slate-600">
              {message}
            </p>

          </div>

          <div className="bg-white border border-blue-100 shadow-sm rounded-3xl p-7 sm:p-10 mb-6 sm:mb-8 text-center">

            {paymentState === "checking" && (
              <>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-4">
                  Just a moment
                </h2>

                <p className="text-slate-600 leading-relaxed">
                  Please wait while MyDNR confirms your
                  payment with PayFast. This normally only
                  takes a few moments.
                </p>

                <p className="text-sm text-slate-500 mt-5">
                  Please do not refresh or close this page
                  while confirmation is in progress.
                </p>
              </>
            )}

            {paymentState === "pending" && (
              <>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-4">
                  Payment Confirmation Is Taking Longer Than Expected
                </h2>

                <p className="text-slate-600 leading-relaxed mb-4">
                  Your payment notification has not yet
                  reached MyDNR.
                </p>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
                  <p className="font-semibold text-slate-900 mb-2">
                    Please do not make another payment.
                  </p>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    If you completed your payment with
                    PayFast, your payment may simply still
                    be processing. You can safely check
                    again below.
                  </p>
                </div>

                <button
                  onClick={handleCheckAgain}
                  disabled={manualChecking}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {manualChecking
                    ? "Checking Payment..."
                    : "Check Payment Again"}
                </button>
              </>
            )}

            {paymentState === "error" && (
              <>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-4">
                  We Couldn&apos;t Confirm Your Payment Yet
                </h2>

                <p className="text-slate-600 leading-relaxed mb-4">
                  MyDNR was unable to confirm your payment
                  at this time.
                </p>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
                  <p className="font-semibold text-slate-900 mb-2">
                    If you have already paid, please do not
                    make another payment.
                  </p>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    You can safely try checking the payment
                    status again below.
                  </p>
                </div>

                <button
                  onClick={handleCheckAgain}
                  disabled={manualChecking}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {manualChecking
                    ? "Checking Payment..."
                    : "Check Payment Again"}
                </button>
              </>
            )}

          </div>

          <Link
            href="/"
            className="block w-full border border-blue-200 bg-white text-blue-700 py-4 rounded-xl text-center font-semibold hover:bg-blue-50 transition-colors"
          >
            Return Home
          </Link>

        </div>
      </main>
    );
  }

  /* =======================================================
     SUCCESS
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10 sm:py-14">

        <Logo />

        {/* Success Heading */}
        <div className="text-center mb-8 sm:mb-10">

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
              <span className="text-4xl text-white font-bold">
                ✓
              </span>
            </div>
          </div>

          <p className="text-sm font-semibold tracking-[0.2em] text-blue-600 uppercase mb-3">
            Registration Successful
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mb-4">
            Registration Complete
          </h1>

          <p className="text-slate-600 leading-relaxed max-w-xl mx-auto">
            Your DNR request has been successfully
            registered with MyDNR.
          </p>

        </div>

        {/* Main Confirmation Panel */}
        <div className="bg-white border border-blue-100 shadow-sm rounded-3xl p-7 sm:p-10 mb-6 sm:mb-8 text-center">

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 mb-5">
            Your DNR Request Is Securely Registered
          </h2>

          <p className="text-slate-600 leading-relaxed mb-4">
            Your payment has been confirmed and your DNR
            request has been successfully registered and
            securely stored within the MyDNR service.
          </p>

          <p className="text-slate-600 leading-relaxed">
            Your DNR record can now be verified using the identification details used for your registration
            details used for your registration.
          </p>

        </div>

        {/* Registration Summary */}
        <div className="bg-white border border-blue-100 shadow-sm rounded-3xl p-7 sm:p-8 mb-6 sm:mb-8">

          <p className="text-sm font-semibold tracking-[0.18em] text-blue-600 uppercase mb-3">
            Registration Status
          </p>

          <h3 className="text-xl sm:text-2xl font-bold text-slate-950 mb-6">
            Everything is complete.
          </h3>

          <div className="space-y-5">

            <StatusItem>
              Your payment has been successfully confirmed.
            </StatusItem>

            <StatusItem>
              Your registration details have been recorded.
            </StatusItem>

            <StatusItem>
              Your signed DNR document has been stored securely.
            </StatusItem>

            <StatusItem>
              Your DNR record can now be verified using your
              South African ID Number.
            </StatusItem>

            <StatusItem>
              Your registered DNR document can be securely
              requested through MyDNR when it is needed.
            </StatusItem>

          </div>

        </div>

        {/* Important Reminder */}
        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-7 sm:p-8 mb-8 sm:mb-10">

          <p className="text-sm font-semibold tracking-[0.18em] text-blue-600 uppercase mb-3">
            One Important Reminder
          </p>

          <h3 className="text-xl sm:text-2xl font-bold text-slate-950 mb-4">
            Make sure someone you trust knows.
          </h3>

          <p className="text-slate-600 leading-relaxed mb-4">
            We encourage you to tell the people close to you
            that your DNR request is registered with MyDNR.
          </p>

          <p className="text-slate-600 leading-relaxed">
            Make sure someone you trust knows your identification details
            used when you registerd and understands your wishes,
            so they know where to look should your DNR
            document ever be needed and you are unable to
            communicate for yourself.
          </p>

        </div>

        {/* Final Action */}
        <Link
          href="/"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-center font-semibold shadow-sm transition-colors"
        >
          Return to MyDNR Home
        </Link>

        <p className="text-center text-sm text-slate-500 mt-6">
          MyDNR South Africa · Secure DNR registration,
          verification &amp; retrieval.
        </p>

      </div>
    </main>
  );
}

/* =========================================================
   STATUS ITEM
========================================================= */

function StatusItem({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
        <span className="text-white text-sm font-bold">
          ✓
        </span>
      </div>

      <p className="text-slate-600 leading-relaxed">
        {children}
      </p>
    </div>
  );
}