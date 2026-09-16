"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type CheckResult = "found" | "not-found" | null;

export default function CheckPage() {
  const [saIdNumber, setSaIdNumber] = useState("");
  const [result, setResult] = useState<CheckResult>(null);
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    const cleanedId = saIdNumber.trim();

    if (!cleanedId) {
      alert(
        "Please enter the South African ID Number of the person whose DNR record you would like to check."
      );
      return;
    }

    if (!/^\d{13}$/.test(cleanedId)) {
      alert(
        "Please enter a valid 13-digit South African ID Number."
      );
      return;
    }

    try {
      setChecking(true);
      setResult(null);

      const response = await fetch(
        `/api/check?saIdNumber=${encodeURIComponent(cleanedId)}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to check DNR status."
        );
      }

      setResult(data.exists ? "found" : "not-found");
    } catch (error: any) {
      console.error("DNR CHECK ERROR:", error);

      alert(
        error?.message || "Unable to check DNR status."
      );
    } finally {
      setChecking(false);
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
            Free DNR Check
          </p>

          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            Check if a DNR Exists
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Quickly check whether a DNR record has been registered
            with MyDNR for a South African ID Number.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)]">

          {/* INTRO PANEL */}
          <div className="border-b border-blue-100 bg-[#f8fbff] px-6 py-7 sm:px-9 sm:py-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                ?
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                  DNR Status Check
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Check the MyDNR Registry
                </h2>

                <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                  Enter the South African ID Number of the person
                  whose DNR record you would like to check.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-7 px-6 py-8 sm:px-9 sm:py-10">

            {/* PRIVACY EXPLANATION */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  i
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    This check protects personal information
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    This free service only confirms whether a DNR
                    record is registered with MyDNR. No personal
                    information or DNR document will be displayed.
                  </p>
                </div>
              </div>
            </div>

            {/* ID INPUT */}
            <div>
              <label
                htmlFor="saIdNumber"
                className="mb-2 block text-sm font-semibold text-slate-900"
              >
                South African ID Number
              </label>

              <input
                id="saIdNumber"
                type="text"
                value={saIdNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");

                  setSaIdNumber(value.slice(0, 13));
                  setResult(null);
                }}
                placeholder="0000000000000"
                maxLength={13}
                inputMode="numeric"
                autoComplete="off"
                className="w-full rounded-xl border border-blue-100 bg-white px-4 py-4 text-center text-xl font-semibold tracking-[0.18em] text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:text-2xl sm:tracking-[0.28em]"
              />

              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-sm leading-6 text-slate-500">
                  Enter the person&apos;s 13-digit South African ID Number.
                </p>

                <span className="shrink-0 text-xs font-semibold text-slate-400">
                  {saIdNumber.length}/13
                </span>
              </div>
            </div>

            {/* CHECK BUTTON */}
            <button
              type="button"
              onClick={handleCheck}
              disabled={checking}
              className="w-full rounded-xl bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checking
                ? "Checking DNR Status..."
                : "Check DNR Status"}
            </button>

            {/* RESULT - FOUND */}
            {result === "found" && (
              <div
                className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center sm:p-8"
                aria-live="polite"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white">
                  ✓
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Record Located
                </p>

                <h3 className="mt-2 text-2xl font-bold text-emerald-900">
                  DNR Record Found
                </h3>

                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-emerald-800 sm:text-base sm:leading-7">
                  A registered DNR record exists for the supplied
                  South African ID Number.
                </p>

                <div className="mt-6 border-t border-emerald-200 pt-6">
                  <p className="mx-auto mb-5 max-w-lg text-sm leading-6 text-emerald-800">
                    If you need the registered DNR document, you can
                    continue to the secure document request process.
                  </p>

                  <Link
                    href={`/request-document?saIdNumber=${encodeURIComponent(
                      saIdNumber
                    )}`}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-md transition hover:bg-blue-700 sm:w-auto"
                  >
                    Request Registered DNR Document
                  </Link>
                </div>
              </div>
            )}

            {/* RESULT - NOT FOUND */}
            {result === "not-found" && (
              <div
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center sm:p-8"
                aria-live="polite"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-xl font-bold text-slate-600">
                  i
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  No Record Located
                </p>

                <h3 className="mx-auto mt-2 max-w-xl text-2xl font-bold leading-tight text-slate-900">
                  DNR Record Not Found For This ID Number
                </h3>

                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                  No registered DNR record could be located for the
                  supplied South African ID Number.
                </p>

                <div className="mt-6 border-t border-slate-200 pt-5">
                  <p className="text-xs leading-5 text-slate-500">
                    Please check that the ID Number was entered
                    correctly before trying again.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HOW THE CHECK WORKS */}
      <section className="mx-auto max-w-4xl px-5 pb-10 sm:px-8 sm:pb-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-white p-5 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              1
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-900">
              Enter an ID Number
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Use the person&apos;s 13-digit South African ID Number.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              2
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-900">
              Check the Registry
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              MyDNR checks whether a registered record exists.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              3
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-900">
              Receive the Result
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Only the existence of a record is confirmed.
            </p>
          </div>
        </div>
      </section>

      {/* REASSURANCE */}
      <section className="border-t border-blue-100 bg-[#eef6fd]">
        <div className="mx-auto grid max-w-4xl gap-5 px-5 py-8 sm:grid-cols-3 sm:px-8">
          <div className="text-center">
            <div className="text-lg text-blue-600">✓</div>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              Free status check
            </p>
          </div>

          <div className="text-center">
            <div className="text-lg text-blue-600">✓</div>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              No document displayed
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