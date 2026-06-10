import Image from "next/image";
import Link from "next/link";

export default function CheckPage() {
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
            Check if a DNR Exists
          </h1>

          <p className="text-slate-600">
            Verify whether a DNR record has been registered for a South African ID Number.
          </p>

        </div>

        {/* Information Panel */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10 text-center">

          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            DNR Status Check
          </h2>

          <p className="text-slate-600 leading-relaxed">
            Enter the participant's South African ID Number below.
            This service only confirms whether a DNR record exists.
            No personal information will be displayed.
          </p>

        </div>

        {/* Search Form */}
        <div className="mb-10">

          <label className="block text-sm font-medium text-slate-1200 mb-4">
            South African ID Number
          </label>

          <input
            type="text"
            placeholder="_ _ _ _ _ _ _ _ _ _ _ _ _"
            maxLength={13}
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full border border-slate-300 rounded-xl px-4 py-4 text-center text-xl tracking-[0.4em] font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
            />

          <p className="mt-2 text-sm text-slate-1200">
            Enter the participant's 13-digit South African ID Number
          </p>

        </div>

        {/* Check Button */}
        <div className="mb-10">

          <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-medium">
            Check DNR Status
          </button>

        </div>

        {/* RESULT - FOUND */}
        <div className="bg-green-50 border border-green-200 rounded-3xl p-8 mb-6 text-center">

          <div className="text-5xl mb-4 text-green-700">
            ✓
          </div>

          <h3 className="text-2xl font-semibold text-green-800 mb-3">
            DNR Record Found
          </h3>

          <p className="text-green-700 mb-6">
            A registered DNR record exists for the supplied South African ID Number.
          </p>

          <Link
            href="/request-document"
            className="inline-block bg-slate-900 text-white px-8 py-3 rounded-xl"
          >
            Request Registered DNR Document
          </Link>

        </div>

        {/* RESULT - NOT FOUND */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center">

          <div className="text-5xl mb-4">
            ⓘ
          </div>

          <h3 className="text-2xl font-semibold text-slate-800 mb-3">
            DNR Record Not Found For This ID Number
          </h3>

          <p className="text-slate-600">
            No registered DNR record could be located for the supplied South African ID Number.
          </p>

        </div>

      </div>
    </main>
  );
}