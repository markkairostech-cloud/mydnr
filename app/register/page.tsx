"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [saIdNumber, setSaIdNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");

  const handleContinue = () => {
    if (!dateOfBirth) {
      alert(
        "Please enter the participant's Date of Birth before continuing."
      );
      return;
    }

    const registrationData = {
      fullName,
      saIdNumber,
      dateOfBirth,
      email,
      mobileNumber,
      nextOfKinName,
      nextOfKinPhone,
    };

    localStorage.setItem(
      "mydnr-registration",
      JSON.stringify(registrationData)
    );

    router.push("/register/documents");
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/mydnr-logo.png"
            alt="MyDNR South Africa"
            width={220}
            height={220}
            priority
          />
        </div>

        {/* Page Heading */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Register a DNR Request
          </h1>

          <p className="text-slate-600">
            Step 1 of 4
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div className="bg-slate-900 h-3 rounded-full w-1/4"></div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10 text-center">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Participant Details
          </h2>

          <p className="text-slate-600 leading-relaxed">
            Please provide the participant&apos;s details below.
            These details will be used to create and identify
            the DNR record.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>

            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              South African ID Number
            </label>

            <input
              type="text"
              value={saIdNumber}
              onChange={(e) => setSaIdNumber(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date of Birth
            </label>

            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mobile Number
            </label>

            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Next of Kin Name (Optional)
            </label>

            <input
              type="text"
              value={nextOfKinName}
              onChange={(e) => setNextOfKinName(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Next of Kin Contact Number (Optional)
            </label>

            <input
              type="tel"
              value={nextOfKinPhone}
              onChange={(e) => setNextOfKinPhone(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

        </div>

        {/* Continue Button */}
        <div className="mt-12">
          <button
            onClick={handleContinue}
            className="block w-full bg-slate-900 text-white py-4 rounded-xl font-medium text-center"
          >
            Continue to Document Uploads
          </button>
        </div>

      </div>
    </main>
  );
}