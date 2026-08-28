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
          registerResult.error ||
            "Failed to save registration."
        );
      }

      const registrationId =
        registerResult.registrationId;

      if (!registrationId) {
        throw new Error(
          "Registration ID was not returned."
        );
      }

      // Step 2: Create the PayFast payment request
      const payfastResponse = await fetch(
        "/api/payfast/start",
        {
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
        }
      );

      if (!payfastResponse.ok) {
        const errorText =
          await payfastResponse.text();

        throw new Error(
          errorText ||
            "Failed to create PayFast payment."
        );
      }

      const payfastData =
        await payfastResponse.json();

      if (
        !payfastData.payfastUrl ||
        !payfastData.fields
      ) {
        throw new Error(
          "Invalid PayFast payment response."
        );
      }

      // Step 3: Build a hidden form and submit it to PayFast
      const form =
        document.createElement("form");

      form.method = "POST";
      form.action = payfastData.payfastUrl;

      Object.entries(
        payfastData.fields
      ).forEach(([key, value]) => {
        const input =
          document.createElement("input");

        input.type = "hidden";
        input.name = key;
        input.value = String(value);

        form.appendChild(input);
      });

      document.body.appendChild(form);

      form.submit();
    } catch (error: any) {
      console.error(
        "PAYMENT START ERROR:",
        error
      );

      alert(
        error?.message ||
          "Failed to start payment."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Logo */}
        <div className="flex justify-center mb-5">
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Register Your DNR Request
          </h1>

          <p className="text-slate-600">
            Step 4 of 4
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div className="bg-slate-900 h-3 rounded-full w-full"></div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-slate-50 rounded-3xl p-6 mb-7 text-center">
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">
            Payment
          </h2>

          <p className="text-slate-600 leading-relaxed">
            A registration fee is required to securely complete
            and store your DNR registration.
          </p>
        </div>

        {/* Registration Summary */}
        <div className="bg-slate-50 rounded-3xl p-6 mb-7">
          <h3 className="text-xl font-semibold text-slate-800 mb-5">
            Registration Summary
          </h3>

          {registration && (
            <div className="space-y-4">

              <div>
                <p className="font-semibold text-slate-800">
                  {registration.fullName}
                </p>

                <p className="font-semibold text-slate-800">
                  ID Number: {registration.saIdNumber}
                </p>

                <p className="font-semibold text-slate-800">
                  Email: {registration.email}
                </p>
              </div>

              <hr />

              <div className="flex justify-between">
                <span className="text-slate-600">
                  Identification Document
                </span>

                <span className="font-medium text-green-700">
                  ✓ Uploaded
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">
                  DNR Document
                </span>

                <span className="font-medium text-green-700">
                  ✓ Uploaded
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">
                  Consent
                </span>

                <span className="font-medium text-green-700">
                  ✓ Accepted
                </span>
              </div>

            </div>
          )}
        </div>

        {/* Fee Panel */}
        <div className="border border-slate-200 rounded-3xl p-7 mb-7 text-center">
          <p className="text-slate-600 mb-2">
            Registration Fee
          </p>

          <p className="text-5xl font-bold text-slate-900 mb-2">
            R400
          </p>

          <p className="text-slate-500 mb-3">
            One-time registration fee
          </p>

          <p className="text-sm text-slate-600">
            Your registration will only be processed once payment
            has been successfully received.
          </p>
        </div>

        {/* Before You Continue */}
        <div className="bg-slate-50 rounded-3xl p-6 mb-7">
          <h3 className="text-xl font-semibold text-slate-800 mb-3">
            Before You Continue
          </h3>

          <p className="text-slate-600 leading-relaxed">
            Once payment is confirmed, your DNR registration will
            be securely stored and available through the MyDNR
            verification and retrieval service when it may be needed.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">

          <Link
            href="/register/consent"
            className="w-1/3 border border-slate-300 text-slate-700 py-4 rounded-xl text-center"
          >
            Back
          </Link>

          <button
            onClick={handleRegistration}
            disabled={saving}
            className="w-2/3 bg-slate-900 text-white py-4 rounded-xl font-medium text-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving
              ? "Connecting to PayFast..."
              : "Complete Registration & Pay R400"}
          </button>

        </div>

      </div>
    </main>
  );
}