"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export default function RegisterDocumentsPage() {
  const router = useRouter();

  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [dnrDocument, setDnrDocument] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const validateFile = (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert("Please select a PDF, JPG, JPEG or PNG file.");
      return false;
    }

    if (file.size <= 0) {
      alert("Please select a valid file.");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("Please select a file smaller than 10 MB.");
      return false;
    }

    return true;
  };

  const handleIdDocumentChange = (file: File | null) => {
    if (!file) {
      setIdDocument(null);
      return;
    }

    if (!validateFile(file)) {
      setIdDocument(null);
      return;
    }

    setIdDocument(file);
  };

  const handleDnrDocumentChange = (file: File | null) => {
    if (!file) {
      setDnrDocument(null);
      return;
    }

    if (!validateFile(file)) {
      setDnrDocument(null);
      return;
    }

    setDnrDocument(file);
  };

  const handleContinue = async () => {
    if (!idDocument || !dnrDocument) {
      alert("Please upload both documents.");
      return;
    }

    setUploading(true);

    try {
      /*
       * Both documents are sent to the
       * MyDNR server for secure validation
       * and upload.
       */
      const formData = new FormData();

      formData.append("idDocument", idDocument);
      formData.append("dnrDocument", dnrDocument);

      const response = await fetch("/api/register/documents", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Document upload failed."
        );
      }

      if (
        !result.uploadSessionId ||
        !result.idDocumentPath ||
        !result.dnrDocumentPath
      ) {
        throw new Error(
          "Secure upload information was not returned."
        );
      }

      const existingData = JSON.parse(
        localStorage.getItem("mydnr-registration") || "{}"
      );

      const updatedData = {
        ...existingData,

        /*
         * This UUID links this pair of uploaded
         * documents to the eventual registration.
         */
        uploadSessionId: result.uploadSessionId,

        /*
         * Original filenames remain only in the
         * local registration flow for display.
         *
         * Supabase Storage continues to use
         * opaque random filenames.
         */
        idDocumentName: idDocument.name,
        dnrDocumentName: dnrDocument.name,

        idDocumentPath: result.idDocumentPath,
        dnrDocumentPath: result.dnrDocumentPath,
      };

      localStorage.setItem(
        "mydnr-registration",
        JSON.stringify(updatedData)
      );

      router.push("/register/consent");
    } catch (error: any) {
      console.error("UPLOAD ERROR:", error);

      alert(
        error?.message || "Document upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  const uploadBoxClass =
    "rounded-2xl border-2 border-dashed border-blue-200 bg-[#fbfdff] p-6 transition sm:p-8";

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
            Upload the documents required to securely support your
            DNR registration.
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
                Step 2 of 4 — Document uploads
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              2
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-blue-50">
            <div className="h-full w-2/4 rounded-full bg-blue-600" />
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)]">

          {/* INTRO */}
          <div className="border-b border-blue-100 bg-[#f8fbff] px-6 py-7 sm:px-9 sm:py-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl text-blue-700">
                ↑
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                  Your Documents
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Document Uploads
                </h2>

                <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                  Please upload the two documents needed to complete
                  your registration: your identification document and
                  your completed, signed DNR request.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-9 sm:py-10">

            {/* ID DOCUMENT */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  1
                </div>

                <h3 className="text-lg font-bold text-slate-950">
                  Upload Your Identification Document
                </h3>
              </div>

              <div className={uploadBoxClass}>
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
                    🪪
                  </div>

                  <p className="mt-4 font-bold text-slate-900">
                    Your Identification Document
                  </p>

                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    Upload a copy of your South African ID Card,
                    ID Book or Passport.
                  </p>

                  <p className="mt-2 text-xs font-medium text-slate-500">
                    PDF, JPG, JPEG or PNG — maximum 10 MB
                  </p>

                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleIdDocumentChange(
                        e.target.files?.[0] || null
                      )
                    }
                    disabled={uploading}
                    className="mx-auto mt-5 block w-full max-w-md cursor-pointer rounded-xl border border-blue-100 bg-white p-3 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  {idDocument && (
                    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      ✓ Identification document selected:{" "}
                      <span className="break-all">
                        {idDocument.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-blue-100" />

            {/* DNR DOCUMENT */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  2
                </div>

                <h3 className="text-lg font-bold text-slate-950">
                  Upload Your Signed DNR Request
                </h3>
              </div>

              <div className={uploadBoxClass}>
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
                    📄
                  </div>

                  <p className="mt-4 font-bold text-slate-900">
                    Your Signed DNR Request
                  </p>

                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    Upload your completed and signed DNR request.
                  </p>

                  <p className="mt-2 text-xs font-medium text-slate-500">
                    PDF, JPG, JPEG or PNG — maximum 10 MB
                  </p>

                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleDnrDocumentChange(
                        e.target.files?.[0] || null
                      )
                    }
                    disabled={uploading}
                    className="mx-auto mt-5 block w-full max-w-md cursor-pointer rounded-xl border border-blue-100 bg-white p-3 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  {dnrDocument && (
                    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      ✓ Signed DNR request selected:{" "}
                      <span className="break-all">
                        {dnrDocument.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TEMPLATE DOWNLOAD */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xl">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                    Need a template?
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-slate-950">
                    Download the MyDNR DNR Template
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Download a blank MyDNR template that you can
                    complete, sign and upload above as your DNR request.
                  </p>
                </div>

                <a
                  href="/templates/dnr-template.pdf"
                  download
                  className="shrink-0 rounded-xl border border-blue-200 bg-white px-5 py-3 text-center text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  Download Template
                </a>
              </div>
            </div>

            {/* SECURITY NOTE */}
            <div className="flex items-start gap-3 rounded-2xl bg-[#f8fbff] p-4">
              <div className="mt-0.5 text-blue-600">✓</div>

              <p className="text-sm leading-6 text-slate-600">
                Your documents are sent to the MyDNR server for secure
                validation and upload before you continue to the next
                registration step.
              </p>
            </div>

            {/* NAVIGATION */}
            <div className="border-t border-blue-100 pt-7">
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="rounded-xl border border-blue-200 bg-white px-6 py-4 text-center font-semibold text-blue-700 transition hover:bg-blue-50 sm:w-1/3"
                >
                  Back
                </Link>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={uploading}
                  className="rounded-xl bg-blue-600 px-6 py-4 text-center font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-2/3"
                >
                  {uploading
                    ? "Uploading Documents Securely..."
                    : "Continue to Consent & Acknowledgement"}
                </button>
              </div>

              <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-500">
                <span className="text-blue-600">✓</span>
                <span>
                  Accepted file types: PDF, JPG, JPEG and PNG — maximum
                  10 MB per document.
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
              Secure upload
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