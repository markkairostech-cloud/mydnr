"use client";

import Image from "next/image";
import Link from "next/link";
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

    const currentYear = new Date().getFullYear();
    const currentTwoDigitYear = currentYear % 100;

    const century =
      yy <= currentTwoDigitYear
        ? Math.floor(currentYear / 100) * 100
        : (Math.floor(currentYear / 100) - 1) * 100;

    const fullYear = century + yy;

    const date = new Date(fullYear, mm - 1, dd);

    if (
      date.getFullYear() !== fullYear ||
      date.getMonth() !== mm - 1 ||
      date.getDate() !== dd
    ) {
      return null;
    }

    const month = String(mm).padStart(2, "0");
    const day = String(dd).padStart(2, "0");

    return `${fullYear}-${month}-${day}`;
  };

  const handleContinue = () => {
    const cleanedName = fullName.trim();
    const cleanedId = saIdNumber.trim();
    const cleanedEmail = email.trim().toLowerCase();
    const cleanedMobile = mobileNumber.trim();

    if (!cleanedName) {
      alert("Please enter your Full Name.");
      return;
    }

    if (!cleanedId) {
      alert("Please enter your South African ID Number.");
      return;
    }

    if (!/^\d{13}$/.test(cleanedId)) {
      alert("Please enter a valid 13-digit South African ID Number.");
      return;
    }

    const dateOfBirth = deriveDateOfBirth(cleanedId);

    if (!dateOfBirth) {
      alert(
        "The date contained in this South African ID Number does not appear to be valid."
      );
      return;
    }

    if (!cleanedEmail) {
      alert("Please enter your Email Address.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanedEmail)) {
      alert("Please enter a valid Email Address.");
      return;
    }

    if (!cleanedMobile) {
      alert("Please enter your Mobile Number.");
      return;
    }

    const registrationData = {
      fullName: cleanedName,
      saIdNumber: cleanedId,
      dateOfBirth,
      email: cleanedEmail,
      mobileNumber: cleanedMobile,
      nextOfKinName: nextOfKinName.trim(),
      nextOfKinPhone: nextOfKinPhone.trim(),
    };

    localStorage.setItem(
      "mydnr-registration",
      JSON.stringify(registrationData)
    );

    router.push("/register/documents");
  };

  const inputClass =
    "w-full rounded-xl border border-blue-100 bg-white px-4 py-3.5 text-[16px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-900";

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
            Record your details and securely continue to your DNR
            documentation.
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
                Step 1 of 4 — Your details
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              1
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-blue-50">
            <div className="h-full w-1/4 rounded-full bg-blue-600" />
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)]">

          {/* FORM INTRO */}
          <div className="border-b border-blue-100 bg-[#f8fbff] px-6 py-7 sm:px-9 sm:py-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl text-blue-700">
                ✓
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                  Your Information
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Your Details
                </h2>

                <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                  Please provide your details below. These will be used to
                  securely identify and retrieve your DNR record when it may
                  be needed.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-9 sm:py-10">

            {/* PERSONAL DETAILS */}
            <div>
              <h3 className="mb-5 text-lg font-bold text-slate-950">
                Personal details
              </h3>

              <div className="space-y-6">
                <div>
                  <label htmlFor="fullName" className={labelClass}>
                    Full Name
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="saIdNumber" className={labelClass}>
                    South African ID Number
                  </label>

                  <input
                    id="saIdNumber"
                    type="text"
                    value={saIdNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setSaIdNumber(value.slice(0, 13));
                    }}
                    maxLength={13}
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    className={inputClass}
                  />

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Enter your 13-digit South African ID Number.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-blue-100" />

            {/* CONTACT DETAILS */}
            <div>
              <h3 className="mb-5 text-lg font-bold text-slate-950">
                Contact details
              </h3>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="mobileNumber" className={labelClass}>
                    Mobile Number
                  </label>

                  <input
                    id="mobileNumber"
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    autoComplete="tel"
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-blue-100" />

            {/* NEXT OF KIN */}
            <div>
              <div className="mb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-950">
                    Next of kin
                  </h3>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Optional
                  </span>
                </div>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  You may add someone close to you who you would like
                  associated with your DNR registration.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="nextOfKinName" className={labelClass}>
                    Next of Kin Name
                  </label>

                  <input
                    id="nextOfKinName"
                    type="text"
                    value={nextOfKinName}
                    onChange={(e) => setNextOfKinName(e.target.value)}
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="nextOfKinPhone" className={labelClass}>
                    Next of Kin Contact Number
                  </label>

                  <input
                    id="nextOfKinPhone"
                    type="tel"
                    value={nextOfKinPhone}
                    onChange={(e) => setNextOfKinPhone(e.target.value)}
                    autoComplete="tel"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-sm leading-6 text-slate-600">
                  Adding a next of kin does not automatically give that person
                  access to your DNR record.
                </p>
              </div>
            </div>

            {/* CONTINUE */}
            <div className="border-t border-blue-100 pt-7">
              <button
                type="button"
                onClick={handleContinue}
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                Continue to Document Uploads
              </button>

              <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-500">
                <span className="text-blue-600">✓</span>
                <span>Your information is used as part of your secure DNR registration.</span>
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