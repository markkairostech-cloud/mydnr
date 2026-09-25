"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConsentPage() {
  const router = useRouter();

  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [consent3, setConsent3] = useState(false);
  const [consent4, setConsent4] = useState(false);
  const [consent5, setConsent5] = useState(false);

  const allChecked =
    consent1 &&
    consent2 &&
    consent3 &&
    consent4 &&
    consent5;

  const handleContinue = () => {
    if (!allChecked) {
      alert(
        "Please review and accept all consent and acknowledgement statements before continuing."
      );
      return;
    }

    const existingData = JSON.parse(
      localStorage.getItem("mydnr-registration") || "{}"
    );

    const validIdentityPresent =
      existingData.identificationType === "SA_ID"
        ? Boolean(existingData.saIdNumber)
        : existingData.identificationType === "PASSPORT"
          ? Boolean(
              existingData.passportNumber &&
              existingData.passportCountry
            )
          : false;

    const requiredRegistrationDataPresent =
      existingData.fullName &&
      validIdentityPresent &&
      existingData.dateOfBirth &&
      existingData.email &&
      existingData.mobileNumber;

    if (!requiredRegistrationDataPresent) {
      alert(
        "Your details are incomplete. Please return to Step 1 and complete the required information."
      );
      router.push("/register");
      return;
    }

    const requiredDocumentsPresent =
      existingData.idDocumentPath &&
      existingData.dnrDocumentPath;

    if (!requiredDocumentsPresent) {
      alert(
        "Required documents have not been uploaded. Please return to Step 2 and upload both documents."
      );
      router.push("/register/documents");
      return;
    }

    const updatedData = {
      ...existingData,
      consentAccepted: true,
      consentDate: new Date().toISOString(),
    };

    localStorage.setItem(
      "mydnr-registration",
      JSON.stringify(updatedData)
    );

    router.push("/register/payment");
  };

  const consentItems = [
    {
      checked: consent1,
      setChecked: setConsent1,
      text:
        "I confirm that the information provided during this registration process is accurate and complete to the best of my knowledge.",
    },
    {
      checked: consent2,
      setChecked: setConsent2,
      text:
        "I confirm that the uploaded DNR document represents my wishes and has been signed accordingly.",
    },
    {
      checked: consent3,
      setChecked: setConsent3,
      text:
        "I understand that MyDNR stores the uploaded documentation for the purpose of registration, verification and retrieval of DNR records.",
    },
    {
      checked: consent4,
      setChecked: setConsent4,
      text:
        "I consent to the collection, storage and processing of personal information for the operation of this service in accordance with applicable South African privacy legislation, including POPIA.",
    },
    {
      checked: consent5,
      setChecked: setConsent5,
      text:
        "I understand that someone who knows the identification details used for my registration may check whether I have a DNR record registered with MyDNR and may request access to my registered DNR document through the MyDNR retrieval process.",
    },
  ];

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
            Review and acknowledge the statements required before
            completing your registration.
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
                Step 3 of 4 — Consent &amp; acknowledgement
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              3
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-blue-50">
            <div className="h-full w-3/4 rounded-full bg-blue-600" />
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
                ✓
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                  Your Consent
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Consent &amp; Acknowledgement
                </h2>

                <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                  Please read each statement carefully. All five
                  acknowledgements must be accepted before you can
                  continue to payment.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-9 sm:py-10">

            {/* CONSENT STATEMENTS */}
            <div>
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-950">
                  Please confirm each statement
                </h3>

                <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  5 required
                </span>
              </div>

              <div className="space-y-4">
                {consentItems.map((item, index) => (
                  <label
                    key={index}
                    className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition ${
                      item.checked
                        ? "border-blue-300 bg-blue-50/70"
                        : "border-blue-100 bg-[#fbfdff] hover:border-blue-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) =>
                        item.setChecked(e.target.checked)
                      }
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-blue-600"
                    />

                    <div className="flex-1">
                      <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                        Acknowledgement {index + 1}
                      </p>

                      <span className="text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
                        {item.text}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* COMPLETION STATUS */}
            <div
              className={`rounded-2xl border p-5 ${
                allChecked
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-blue-100 bg-[#f8fbff]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    allChecked
                      ? "bg-emerald-600 text-white"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {allChecked ? "✓" : "i"}
                </div>

                <div>
                  <p
                    className={`font-semibold ${
                      allChecked
                        ? "text-emerald-800"
                        : "text-slate-900"
                    }`}
                  >
                    {allChecked
                      ? "All acknowledgements accepted"
                      : "All five acknowledgements are required"}
                  </p>

                  <p
                    className={`mt-1 text-sm leading-6 ${
                      allChecked
                        ? "text-emerald-700"
                        : "text-slate-600"
                    }`}
                  >
                    {allChecked
                      ? "You can now continue to the payment step."
                      : "Please review and tick each statement above before continuing."}
                  </p>
                </div>
              </div>
            </div>

            {/* IMPORTANT NOTICE */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 font-bold text-amber-700">
                  !
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    Important Notice
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
                    MyDNR acts as a secure document registration and
                    retrieval service. Registration of a DNR document
                    does not constitute medical advice, legal advice or
                    validation of the document&apos;s contents.
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
                    We encourage you to discuss your DNR wishes with
                    your healthcare practitioner and the people close
                    to you, so they understand your wishes should the
                    document ever be needed.
                  </p>
                </div>
              </div>
            </div>

            {/* PRIVACY LINK */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
              <p className="text-sm leading-6 text-slate-600">
                You can read more about how MyDNR handles personal
                information in our{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-800"
                >
                  Privacy Notice
                </Link>
                .
              </p>
            </div>

            {/* NAVIGATION */}
            <div className="border-t border-blue-100 pt-7">
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Link
                  href="/register/documents"
                  className="rounded-xl border border-blue-200 bg-white px-6 py-4 text-center font-semibold text-blue-700 transition hover:bg-blue-50 sm:w-1/3"
                >
                  Back
                </Link>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!allChecked}
                  className={`rounded-xl px-6 py-4 text-center font-bold text-white shadow-md transition sm:w-2/3 ${
                    allChecked
                      ? "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
                      : "cursor-not-allowed bg-slate-300 shadow-none"
                  }`}
                >
                  Continue to Payment
                </button>
              </div>

              <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-500">
                <span className="text-blue-600">✓</span>
                <span>
                  Your consent acceptance and date will be recorded
                  as part of your registration.
                </span>
              </div>
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
              Clear consent
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