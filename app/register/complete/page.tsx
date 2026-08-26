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

function CheckingPayment() {
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
            Confirming Registration
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

  useEffect(() => {
    if (!registrationId) {
      setPaymentState("error");
      setMessage(
        "We could not identify this registration."
      );
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;

    const checkPayment = async () => {
      try {
        attempts += 1;

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

        if (
          result.registration?.payment_status ===
          "paid"
        ) {
          setPaymentState("paid");
          setMessage("Payment confirmed.");
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

    let timer: ReturnType<typeof setInterval>;

    const startChecking = async () => {
      const finished = await checkPayment();

      if (finished) {
        return;
      }

      timer = setInterval(async () => {
        const done = await checkPayment();

        if (done) {
          clearInterval(timer);
        }
      }, 2000);
    };

    startChecking();

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [registrationId]);

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
              Confirming Registration
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
                You can return shortly to confirm your
                registration.
              </p>
            )}

            {paymentState === "error" && (
              <p className="text-slate-600 leading-relaxed">
                We were unable to verify this registration.
                Please return home and contact MyDNR if you
                believe your payment was completed.
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
            Registration Complete
          </h1>

          <p className="text-slate-600">
            Thank you for registering a DNR request with MyDNR.
          </p>

        </div>

        <div className="bg-slate-50 rounded-3xl p-10 mb-10 text-center">

          <h2 className="text-2xl font-semibold text-slate-800 mb-6">
            Your DNR Request Has Been Registered
          </h2>

          <p className="text-slate-600 leading-relaxed mb-4">
            The participant&apos;s DNR request has been
            successfully registered and securely stored
            within the MyDNR service.
          </p>

          <p className="text-slate-600 leading-relaxed">
            A DNR record has been created and may be
            verified through the MyDNR verification and
            retrieval service when required.
          </p>

        </div>

        <div className="bg-slate-50 rounded-3xl p-8 mb-10">

          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            What Happens Next?
          </h3>

          <ul className="space-y-3 text-slate-600">

            <li>
              ✓ Payment has been successfully confirmed.
            </li>

            <li>
              ✓ The participant&apos;s details have been recorded.
            </li>

            <li>
              ✓ The uploaded DNR document has been stored securely.
            </li>

            <li>
              ✓ The DNR record can now be verified using the participant&apos;s South African ID Number.
            </li>

            <li>
              ✓ A registered DNR document may be requested through the MyDNR service if required.
            </li>

          </ul>

        </div>

        <div className="bg-slate-50 rounded-3xl p-8 mb-10">

          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            Important Reminder
          </h3>

          <p className="text-slate-600 leading-relaxed">
            Individuals are encouraged to discuss DNR decisions
            with their healthcare providers, caregivers and loved
            ones to ensure that their wishes are understood.
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