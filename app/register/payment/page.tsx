"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PaymentPage() {
  const [registration, setRegistration] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("mydnr-registration");

    if (data) {
      setRegistration(JSON.parse(data));
    }
  }, []);

  const handleRegistration = async () => {
    if (!registration) {
      alert(
        "Registration data could not be found. Please restart the registration process."
      );
      return;
    }

    const requiredParticipantDataPresent =
      registration.fullName &&
      registration.saIdNumber &&
      registration.dateOfBirth &&
      registration.email &&
      registration.mobileNumber;

    if (!requiredParticipantDataPresent) {
      alert(
        "Your details are incomplete. Please return to Step 1 and complete all required information."
      );
      return;
    }

    const requiredDocumentsPresent =
      registration.idDocumentPath &&
      registration.dnrDocumentPath;

    if (!requiredDocumentsPresent) {
      alert(
        "Required documents are missing. Please return to Step 2 and upload both documents."
      );
      return;
    }

    if (registration.consentAccepted !== true) {
      alert(
        "Consent has not been completed. Please return to Step 3 and accept all required acknowledgements."
      );
      return;
    }

    try {
      setSaving(true);

      // Step 1: Create the DNR registration
      const registerResponse = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registration),
      });

      const registerResult = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(
          registerResult.error || "Failed to save registration."
        );
      }

      const registrationId = registerResult.registrationId;

      if (!registrationId) {
        throw new Error("Registration ID was not returned.");
      }

      // Step 2: Create the PayFast payment request
      const payfastResponse = await fetch("/api/payfast/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationId,
          fullName: registration.fullName,
          email: registration.email,
          saIdNumber: registration.saIdNumber,
        }),
      });

      if (!payfastResponse.ok) {
        const errorText = await payfastResponse.text();

        throw new Error(
          errorText || "Failed to create PayFast payment."
        );
      }

      const payfastData = await payfastResponse.json();

      if (!payfastData.payfastUrl || !payfastData.fields) {
        throw new Error("Invalid PayFast payment response.");
      }

      // Step 3: Build a hidden form and submit it to PayFast
      const form = document.createElement("form");

      form.method = "POST";
      form.action = payfastData.payfastUrl;

      Object.entries(payfastData.fields).forEach(([key, value]) => {
        const input = document.createElement("input");

        input.type = "hidden";
        input.name = key;
        input.value = String(value);

        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error: any) {
      console.error("PAYMENT START ERROR:", error);

      alert(error?.message || "Failed to start payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f9fd] text-slate-950">

      {/* HEADER */}
      <header className="border-b border-blue-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" aria-label="Back to MyDNR home">
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
        <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-blue-600">
            Secure Registration
          </p>

          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            Register Your DNR Request
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Review your registration and complete the one-time payment
            to securely submit your DNR registration.
          </p>
        </div>
      </section>

      {/* PROGRESS */}
      <section className="mx-auto max-w-4xl px-5 pt-8 sm:px-8 sm:pt-10">
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                Registration Journey
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                Step 4 of 4 — Review &amp; payment
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              4
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-blue-50">
            <div className="h-full w-full rounded-full bg-blue-600" />
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)]">

          {/* INTRO */}
          <div className="border-b border-blue-100 bg-[#f8fbff] px-6 py-7 sm:px-9 sm:py-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                R
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                  Final Step
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Review &amp; Payment
                </h2>

                <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                  Please review the registration summary below before
                  continuing to secure payment.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-9 sm:py-10">

            {/* REGISTRATION SUMMARY */}
            <div>
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-950">
                  Registration Summary
                </h3>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Ready
                </span>
              </div>

              {registration ? (
                <div className="overflow-hidden rounded-2xl border border-blue-100 bg-[#fbfdff]">

                  {/* PARTICIPANT */}
                  <div className="border-b border-blue-100 p-5 sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                      Participant
                    </p>

                    <p className="mt-3 text-lg font-bold text-slate-950">
                      {registration.fullName}
                    </p>

                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-slate-800">
                          ID Number:
                        </span>{" "}
                        {registration.saIdNumber}
                      </p>

                      <p className="break-all">
                        <span className="font-semibold text-slate-800">
                          Email:
                        </span>{" "}
                        {registration.email}
                      </p>
                    </div>
                  </div>

                  {/* STATUS */}
                  <div className="divide-y divide-blue-100">
                    <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                      <span className="text-sm text-slate-600">
                        Identification Document
                      </span>

                      <span className="shrink-0 text-sm font-semibold text-emerald-700">
                        ✓ Uploaded
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                      <span className="text-sm text-slate-600">
                        DNR Document
                      </span>

                      <span className="shrink-0 text-sm font-semibold text-emerald-700">
                        ✓ Uploaded
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                      <span className="text-sm text-slate-600">
                        Consent &amp; Acknowledgement
                      </span>

                      <span className="shrink-0 text-sm font-semibold text-emerald-700">
                        ✓ Accepted
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-blue-100 bg-[#fbfdff] p-6 text-sm text-slate-600">
                  Loading your registration details...
                </div>
              )}
            </div>

            {/* FEE PANEL */}
            <div className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/60">
              <div className="p-7 text-center sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                  Registration Fee
                </p>

                <div className="mt-3 flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
                    R400
                  </span>
                </div>

                <p className="mt-2 font-semibold text-slate-700">
                  One-time registration fee
                </p>

                <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600">
                  Your registration will only be processed once
                  payment has been successfully received.
                </p>
              </div>

              <div className="border-t border-blue-100 bg-white/60 px-6 py-4 text-center">
                <p className="text-xs leading-5 text-slate-500">
                  You will be transferred to PayFast to complete
                  your payment securely.
                </p>
              </div>
            </div>

            {/* BEFORE YOU CONTINUE */}
            <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
                  ✓
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    Before You Continue
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                    Once payment is confirmed, your DNR registration
                    will be securely stored and available through the
                    MyDNR verification and retrieval service when it
                    may be needed.
                  </p>
                </div>
              </div>
            </div>

            {/* PAYMENT REASSURANCE */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-blue-100 bg-white p-4 text-center">
                <div className="text-blue-600">✓</div>
                <p className="mt-1 text-xs font-semibold text-slate-700">
                  Secure payment
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-white p-4 text-center">
                <div className="text-blue-600">✓</div>
                <p className="mt-1 text-xs font-semibold text-slate-700">
                  One-time fee
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-white p-4 text-center">
                <div className="text-blue-600">✓</div>
                <p className="mt-1 text-xs font-semibold text-slate-700">
                  PayFast checkout
                </p>
              </div>
            </div>

            {/* NAVIGATION */}
            <div className="border-t border-blue-100 pt-7">
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Link
                  href="/register/consent"
                  className="rounded-xl border border-blue-200 bg-white px-6 py-4 text-center font-semibold text-blue-700 transition hover:bg-blue-50 sm:w-1/3"
                >
                  Back
                </Link>

                <button
                  type="button"
                  onClick={handleRegistration}
                  disabled={saving || !registration}
                  className="rounded-xl bg-blue-600 px-6 py-4 text-center font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-2/3"
                >
                  {saving
                    ? "Connecting to PayFast..."
                    : "Complete Registration & Pay R400"}
                </button>
              </div>

              <p className="mt-5 text-center text-xs leading-5 text-slate-500">
                By continuing, you will leave MyDNR temporarily to
                complete your payment through PayFast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* REASSURANCE */}
      <section className="border-t border-blue-100 bg-[#eef6fd]">
        <div className="mx-auto grid max-w-4xl gap-5 px-5 py-8 sm:grid-cols-3 sm:px-8">
          <div className="text-center">
            <div className="text-lg text-blue-600">✓</div>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              Secure registration
            </p>
          </div>

          <div className="text-center">
            <div className="text-lg text-blue-600">✓</div>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              POPIA-conscious
            </p>
          </div>

          <div className="text-center">
            <div className="text-lg text-blue-600">✓</div>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              South African service
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
            <Link href="/privacy" className="hover:text-blue-700">
              Privacy
            </Link>

            <Link href="/terms" className="hover:text-blue-700">
              Terms
            </Link>

            <Link href="/disclaimer" className="hover:text-blue-700">
              Disclaimer
            </Link>

            <Link href="/contact" className="hover:text-blue-700">
              Contact
            </Link>

            <Link href="/about" className="hover:text-blue-700">
              About
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}