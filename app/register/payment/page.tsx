"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PaymentPage() {
  const [registration, setRegistration] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("mydnr-registration");

    if (data) {
      setRegistration(JSON.parse(data));
    }
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/mydnr-logo.png"
            alt="MyDNR South Africa"
            width={300}
            height={300}
            priority
          />
        </div>

        {/* Page Heading */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Register a DNR Request
          </h1>

          <p className="text-slate-600">
            Step 4 of 4
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div className="bg-slate-900 h-3 rounded-full w-full"></div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10 text-center">

          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Payment
          </h2>

          <p className="text-slate-600 leading-relaxed">
            A registration fee is required to complete registration
            and securely store the participant's DNR record.
          </p>

        </div>

        {/* Registration Summary */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10">

          <h3 className="text-xl font-semibold text-slate-800 mb-6">
            Registration Summary
          </h3>

          {registration && (
            <div className="space-y-5">

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
        <div className="border border-slate-200 rounded-3xl p-10 mb-10 text-center">

          <p className="text-slate-600 mb-3">
            Registration Fee
          </p>

          <p className="text-5xl font-bold text-slate-900 mb-3">
            R100
          </p>

          <p className="text-slate-500 mb-4">
            One-time registration fee
          </p>

          <p className="text-sm text-slate-600">
            Your registration will only be processed once payment
            has been successfully received.
          </p>

        </div>

        {/* Important Note */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10">

          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            Before You Continue
          </h3>

          <p className="text-slate-600 leading-relaxed">
            Once payment has been completed, the participant's
            DNR documentation will be securely stored and made
            available through the MyDNR registration, verification
            and retrieval service.
          </p>

        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">

          <Link
            href="/register/consent"
            className="w-1/3 border border-slate-300 text-slate-700 py-4 rounded-xl text-center"
          >
            Back
          </Link>

          <Link
            href="/register/complete"
            className="w-2/3 bg-slate-900 text-white py-4 rounded-xl font-medium text-center"
          >
            Complete Registration & Pay R100
          </Link>

        </div>

      </div>
    </main>
  );
}