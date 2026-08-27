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

export default function RegisterPage() {
  const router = useRouter();

  const [idDocument, setIdDocument] =
    useState<File | null>(null);

  const [dnrDocument, setDnrDocument] =
    useState<File | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const validateFile = (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert(
        "Please select a PDF, JPG, JPEG or PNG file."
      );

      return false;
    }

    if (file.size <= 0) {
      alert(
        "Please select a valid file."
      );

      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert(
        "Please select a file smaller than 10 MB."
      );

      return false;
    }

    return true;
  };

  const handleIdDocumentChange = (
    file: File | null
  ) => {
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

  const handleDnrDocumentChange = (
    file: File | null
  ) => {
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
      alert(
        "Please upload both documents."
      );

      return;
    }

    setUploading(true);

    try {
      /*
       * Both documents are now sent to the
       * MyDNR server.
       *
       * The browser no longer uploads
       * directly to Supabase Storage.
       */
      const formData =
        new FormData();

      formData.append(
        "idDocument",
        idDocument
      );

      formData.append(
        "dnrDocument",
        dnrDocument
      );

      const response =
        await fetch(
          "/api/register/documents",
          {
            method: "POST",
            body: formData,
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "Document upload failed."
        );
      }

      if (
        !result.idDocumentPath ||
        !result.dnrDocumentPath
      ) {
        throw new Error(
          "Secure document paths were not returned."
        );
      }

      const existingData =
        JSON.parse(
          localStorage.getItem(
            "mydnr-registration"
          ) || "{}"
        );

      const updatedData = {
        ...existingData,

        /*
         * Original filenames are kept only
         * for the local registration flow/UI.
         *
         * Supabase Storage uses opaque random
         * filenames generated server-side.
         */
        idDocumentName:
          idDocument.name,

        dnrDocumentName:
          dnrDocument.name,

        idDocumentPath:
          result.idDocumentPath,

        dnrDocumentPath:
          result.dnrDocumentPath,
      };

      localStorage.setItem(
        "mydnr-registration",
        JSON.stringify(updatedData)
      );

      router.push(
        "/register/consent"
      );

    } catch (error: any) {
      console.error(
        "UPLOAD ERROR:",
        error
      );

      alert(
        error?.message ||
          "Document upload failed."
      );

    } finally {
      setUploading(false);
    }
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
            Step 2 of 4
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div className="bg-slate-900 h-3 rounded-full w-2/4"></div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10 text-center">

          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Document Uploads
          </h2>

          <p className="text-slate-600 leading-relaxed">
            Please upload the two documents needed to complete
            your registration: your identification document and
            your completed, signed DNR request.
          </p>

        </div>

        {/* ID Document Upload */}
        <div className="mb-8">

          <label className="block text-base font-semibold text-slate-800 mb-3">
            1. Upload Your Identification Document
          </label>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center">

            <div className="text-5xl mb-4">
              🪪
            </div>

            <p className="font-semibold text-slate-800 mb-2">
              Your Identification Document
            </p>

            <p className="text-slate-600 text-sm mb-2">
              Upload a copy of your South African ID Card,
              ID Book or Passport.
            </p>

            <p className="text-slate-500 text-sm mb-4">
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
              className="mt-2 block w-full text-sm text-slate-500 disabled:opacity-60"
            />

            {idDocument && (
              <div className="mt-4 text-green-700 font-medium">
                ✓ Identification document selected:{" "}
                {idDocument.name}
              </div>
            )}

          </div>

        </div>

        {/* DNR Upload */}
        <div className="mb-10">

          <label className="block text-base font-semibold text-slate-800 mb-3">
            2. Upload Your Signed DNR Request
          </label>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center">

            <div className="text-5xl mb-4">
              📄
            </div>

            <p className="font-semibold text-slate-800 mb-2">
              Your Signed DNR Request
            </p>

            <p className="text-slate-600 text-sm mb-2">
              Upload your completed and signed DNR request.
            </p>

            <p className="text-slate-500 text-sm mb-4">
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
              className="mt-2 block w-full text-sm text-slate-500 disabled:opacity-60"
            />

            {dnrDocument && (
              <div className="mt-4 text-green-700 font-medium">
                ✓ Signed DNR request selected:{" "}
                {dnrDocument.name}
              </div>
            )}

          </div>

        </div>

        {/* Template Download */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10 text-center">

          <h3 className="text-xl font-semibold text-slate-800 mb-3">
            Need a DNR Template?
          </h3>

          <p className="text-slate-600 mb-6">
            Download a blank MyDNR template that you can complete,
            sign and upload above as your DNR request.
          </p>

          <a
            href="/templates/dnr-template.pdf"
            download
            className="inline-block bg-slate-900 text-white px-8 py-3 rounded-xl"
          >
            Download DNR Template
          </a>

        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">

          <Link
            href="/register"
            className="w-1/3 border border-slate-300 text-slate-700 py-4 rounded-xl text-center"
          >
            Back
          </Link>

          <button
            onClick={handleContinue}
            disabled={uploading}
            className="w-2/3 bg-slate-900 text-white py-4 rounded-xl text-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading
              ? "Uploading Documents Securely..."
              : "Continue to Consent & Acknowledgement"}
          </button>

        </div>

      </div>
    </main>
  );
}