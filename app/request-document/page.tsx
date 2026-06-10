import Image from "next/image";

export default function RequestDocumentPage() {
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
            Request a DNR Document
          </h1>

          <p className="text-slate-600">
            Request access to a registered DNR document.
          </p>

        </div>

        {/* Information Panel */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10 text-center">

          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Document Retrieval Request
          </h2>

          <p className="text-slate-600 leading-relaxed">
            Complete the information below to request access to a
            registered DNR document. A retrieval fee of R100 applies.
          </p>

        </div>

        {/* SA ID Number */}
        <div className="mb-8">

          <label className="block text-xl font-semibold text-slate-800 mb-3">
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

          <p className="mt-3 text-base font-medium text-slate-700">
            Enter the participant's 13-digit South African ID Number
          </p>

        </div>

        {/* Your Full Name */}
        <div className="mb-8">

          <label className="block text-xl font-semibold text-slate-800 mb-3">
            Your Full Name
          </label>

          <input
            type="text"
            className="w-full border border-slate-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />

        </div>

        {/* Email Address */}
        <div className="mb-8">

          <label className="block text-xl font-semibold text-slate-800 mb-3">
            Email Address
          </label>

          <input
            type="email"
            className="w-full border border-slate-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />

        </div>

        {/* Confirmation Checkbox */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10">

          <label className="flex items-start gap-4">

            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
            />

            <span className="text-slate-700 leading-relaxed">
              I confirm that I have a legitimate reason for requesting access to this document..
            </span>

          </label>

        </div>

        {/* Fee Panel */}
        <div className="border border-slate-200 rounded-3xl p-10 mb-10 text-center">

          <p className="text-slate-600 mb-3">
            Document Retrieval Fee
          </p>

          <p className="text-5xl font-bold text-slate-900 mb-3">
            R100
          </p>

          <p className="text-slate-500">
            One-time document retrieval fee
          </p>

        </div>

        {/* Important Notice */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10">

          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            Important Notice
          </h3>

          <p className="text-slate-600 leading-relaxed">
            All document retrieval requests are recorded for audit
            and security purposes. MyDNR may retain a record of
            the request, including the requestor's details, date
            and time of access.
          </p>

        </div>

        {/* Payment Button */}
        <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-medium">
          Pay R100 & Continue
        </button>

      </div>
    </main>
  );
}