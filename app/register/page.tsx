"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [saIdNumber, setSaIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");

  const deriveDateOfBirth = (idNumber: string) => {
    const yy = Number(idNumber.slice(0, 2));
    const mm = Number(idNumber.slice(2, 4));
    const dd = Number(idNumber.slice(4, 6));

    if (
      Number.isNaN(yy) ||
      Number.isNaN(mm) ||
      Number.isNaN(dd) ||
      mm < 1 ||
      mm > 12 ||
      dd < 1 ||
      dd > 31
    ) {
      return null;
    }

    const currentYear =
      new Date().getFullYear();

    const currentTwoDigitYear =
      currentYear % 100;

    const century =
      yy <= currentTwoDigitYear
        ? Math.floor(currentYear / 100) * 100
        : (Math.floor(currentYear / 100) - 1) * 100;

    const fullYear = century + yy;

    const date = new Date(
      fullYear,
      mm - 1,
      dd
    );

    if (
      date.getFullYear() !== fullYear ||
      date.getMonth() !== mm - 1 ||
      date.getDate() !== dd
    ) {
      return null;
    }

    const month =
      String(mm).padStart(2, "0");

    const day =
      String(dd).padStart(2, "0");

    return `${fullYear}-${month}-${day}`;
  };

  const handleContinue = () => {
    const cleanedName = fullName.trim();
    const cleanedId = saIdNumber.trim();
    const cleanedEmail =
      email.trim().toLowerCase();
    const cleanedMobile =
      mobileNumber.trim();

    if (!cleanedName) {
      alert(
        "Please enter your Full Name."
      );
      return;
    }

    if (!cleanedId) {
      alert(
        "Please enter your South African ID Number."
      );
      return;
    }

    if (!/^\d{13}$/.test(cleanedId)) {
      alert(
        "Please enter a valid 13-digit South African ID Number."
      );
      return;
    }

    const dateOfBirth =
      deriveDateOfBirth(cleanedId);

    if (!dateOfBirth) {
      alert(
        "The date contained in this South African ID Number does not appear to be valid."
      );
      return;
    }

    if (!cleanedEmail) {
      alert(
        "Please enter your Email Address."
      );
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanedEmail)) {
      alert(
        "Please enter a valid Email Address."
      );
      return;
    }

    if (!cleanedMobile) {
      alert(
        "Please enter your Mobile Number."
      );
      return;
    }

    const registrationData = {
      fullName: cleanedName,
      saIdNumber: cleanedId,
      dateOfBirth,
      email: cleanedEmail,
      mobileNumber: cleanedMobile,
      nextOfKinName:
        nextOfKinName.trim(),
      nextOfKinPhone:
        nextOfKinPhone.trim(),
    };

    localStorage.setItem(
      "mydnr-registration",
      JSON.stringify(registrationData)
    );

    router.push(
      "/register/documents"
    );
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Logo */}
        <div className="flex justify-center mb-8">
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
            Your Details
          </h2>

          <p className="text-slate-600 leading-relaxed">
            Please provide your details below.
            These will be used to securely identify
            and retrieve your DNR record when it may
            be needed.
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
              onChange={(e) =>
                setFullName(e.target.value)
              }
              required
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
              onChange={(e) => {
                const value =
                  e.target.value.replace(/\D/g, "");

                setSaIdNumber(
                  value.slice(0, 13)
                );
              }}
              maxLength={13}
              inputMode="numeric"
              required
              className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />

            <p className="mt-2 text-sm text-slate-500">
              Enter your 13-digit South African ID Number
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
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
              onChange={(e) =>
                setMobileNumber(e.target.value)
              }
              required
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
              onChange={(e) =>
                setNextOfKinName(
                  e.target.value
                )
              }
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
              onChange={(e) =>
                setNextOfKinPhone(
                  e.target.value
                )
              }
              className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />

            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
              Optional — you may add the details of someone close to you
              who you would like associated with your DNR registration.
              This does not automatically give them access to your record.
            </p>
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