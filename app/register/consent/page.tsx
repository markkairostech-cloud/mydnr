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

    const requiredRegistrationDataPresent =
      existingData.fullName &&
      existingData.saIdNumber &&
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

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">

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

        {/* Page Heading */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Register Your DNR Request
          </h1>

          <p className="text-slate-600">
            Step 3 of 4
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div className="bg-slate-900 h-3 rounded-full w-3/4"></div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10 text-center">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Consent & Acknowledgement
          </h2>

          <p className="text-slate-600 leading-relaxed">
            Before completing your registration, please review
            and acknowledge the statements below.
          </p>
        </div>

        {/* Consent Statements */}
        <div className="space-y-6 mb-10">

          <label className="flex items-start gap-4">
            <input
              type="checkbox"
              checked={consent1}
              onChange={(e) => setConsent1(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0"
            />

            <span className="text-slate-700">
              I confirm that the information provided during this
              registration process is accurate and complete to the
              best of my knowledge.
            </span>
          </label>

          <label className="flex items-start gap-4">
            <input
              type="checkbox"
              checked={consent2}
              onChange={(e) => setConsent2(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0"
            />

            <span className="text-slate-700">
              I confirm that the uploaded DNR document represents
              my wishes and has been signed accordingly.
            </span>
          </label>

          <label className="flex items-start gap-4">
            <input
              type="checkbox"
              checked={consent3}
              onChange={(e) => setConsent3(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0"
            />

            <span className="text-slate-700">
              I understand that MyDNR stores the uploaded
              documentation for the purpose of registration,
              verification and retrieval of DNR records.
            </span>
          </label>

          <label className="flex items-start gap-4">
            <input
              type="checkbox"
              checked={consent4}
              onChange={(e) => setConsent4(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0"
            />

            <span className="text-slate-700">
              I consent to the collection, storage and processing
              of personal information for the operation of this
              service in accordance with applicable South African
              privacy legislation, including POPIA.
            </span>
          </label>

          <label className="flex items-start gap-4">
            <input
              type="checkbox"
              checked={consent5}
              onChange={(e) => setConsent5(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0"
            />

            <span className="text-slate-700">
              I understand that someone who knows my South African
              ID Number may check whether I have a DNR record
              registered with MyDNR and may request access to my
              registered DNR document through the MyDNR retrieval
              process.
            </span>
          </label>

        </div>

        {/* Important Notice */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10">

          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            Important Notice
          </h3>

          <p className="text-slate-600 leading-relaxed">
            MyDNR acts as a secure document registration and retrieval
            service. Registration of a DNR document does not constitute
            medical advice, legal advice or validation of the document&apos;s
            contents.
          </p>

          <p className="text-slate-600 leading-relaxed mt-4">
            We encourage you to discuss your DNR wishes with your
            healthcare practitioner and the people close to you, so they
            understand your wishes should the document ever be needed.
          </p>

        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">

          <Link
            href="/register/documents"
            className="w-1/3 border border-slate-300 text-slate-700 py-4 rounded-xl text-center"
          >
            Back
          </Link>

          <button
            onClick={handleContinue}
            disabled={!allChecked}
            className={`w-2/3 py-4 rounded-xl text-center text-white ${
              allChecked
                ? "bg-slate-900"
                : "bg-slate-400 cursor-not-allowed"
            }`}
          >
            Continue to Payment
          </button>

        </div>

      </div>
    </main>
  );
}