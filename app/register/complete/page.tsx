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

function Logo() {
  return (
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
  );
}

function CheckingPayment() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">

        <Logo />

        <div className="text-center mb-10">

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-4xl text-slate-700">
                …
              </span>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Confirming Your Registration
          </h1>

          <p className="text-slate-600">
            Confirming your payment...
          </p>

        </div>

        <div className="bg-slate-50 rounded-3xl p-10 mb-10 text-center">

          <p className="text-slate-600 leading-relaxed">
            Please wait while MyDNR confirms your payment
            with PayFast. This normally only takes a few
            moments.
          </p>

        </div>

      </div>
    </main>
  );
}

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

  useEffect(() => {
    if (!registrationId) {
      setPaymentState("error");
      setMessage(
        "We could not identify this registration."
      );
      return;
    }

    let attempts = 0;

    // Initial check + subsequent checks every 2 seconds
    // gives the PayFast notification roughly 60 seconds
    // to reach MyDNR.
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

  if (paymentState !== "paid") {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <Logo />

          <div className="text-center mb-10">

            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">

                <span className="text-4xl text-slate-700">
                  …
                </span>

              </div>
            </div>

            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Confirming Your Registration
            </h1>

            <p className="text-slate-600">
              {message}
            </p>

          </div>

          <div className="bg-slate-50 rounded-3xl p-10 mb-8 text-center">

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
                  We were unable to confirm your payment
                  at this time. If you completed the PayFast
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

          <Link
            href="/"
            className="block w-full border border-slate-300 text-slate-700 py-4 rounded-xl text-center font-medium"
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

        <Logo />

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
            Registration Complete
          </h1>

          <p className="text-slate-600">
            Your DNR request has been successfully registered with MyDNR.
          </p>

        </div>

        {/* Confirmation Panel */}
        <div className="bg-slate-50 rounded-3xl p-10 mb-10 text-center">

          <h2 className="text-2xl font-semibold text-slate-800 mb-6">
            Your DNR Request Is Securely Registered
          </h2>

          <p className="text-slate-600 leading-relaxed mb-4">
            Your DNR request has been successfully registered
            and securely stored within the MyDNR service.
          </p>

          <p className="text-slate-600 leading-relaxed">
            Your DNR record can now be verified using your
            South African ID Number and your registered DNR
            document can be securely retrieved when it may
            be needed.
          </p>

        </div>

        {/* What Happens Next */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10">

          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            Your Registration Is Complete!
          </h3>

          <ul className="space-y-3 text-slate-600">

            <li>
              ✓ Your payment has been successfully confirmed.
            </li>

            <li>
              ✓ Your registration details have been recorded.
            </li>

            <li>
              ✓ Your signed DNR document has been stored securely.
            </li>

            <li>
              ✓ Your DNR record can now be verified using your
              South African ID Number.
            </li>

            <li>
              ✓ Your registered DNR document can be securely
              requested through MyDNR when it is needed.
            </li>

          </ul>

        </div>

        {/* Important Reminder */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10">

          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            One Important Final Step
          </h3>

          <p className="text-slate-600 leading-relaxed mb-4">
            We encourage you to tell the people close to you
            that your DNR request is registered with MyDNR.
          </p>

          <p className="text-slate-600 leading-relaxed">
            Make sure someone you trust knows your South African
            ID Number and understands your wishes, so they know
            where to look should your DNR document ever be needed
            and you are unable to communicate for yourself.
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