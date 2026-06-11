"use client";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [dnrDocument, setDnrDocument] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (
  file: File,
  bucket: string
) => {
  const fileName = `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) {
    throw error;
  }

  return data.path;
};

  const handleContinue = async () => {
    if (!idDocument || !dnrDocument) {
      alert("Please upload both documents.");
      return;
    }

    setUploading(true);

    try {
      const idDocumentPath = await uploadFile(
      idDocument,
      "id-documents"
    );

    const dnrDocumentPath = await uploadFile(
      dnrDocument,
      "dnr-documents"
    );

    const existingData = JSON.parse(
      localStorage.getItem("mydnr-registration") || "{}"
    );

    const updatedData = {
      ...existingData,
      idDocumentName: idDocument.name,
      dnrDocumentName: dnrDocument.name,
      idDocumentPath,
      dnrDocumentPath,
    };

    localStorage.setItem(
      "mydnr-registration",
      JSON.stringify(updatedData)
    );

        router.push("/register/consent");

    } catch (error: any) {
      console.error("UPLOAD ERROR:", error);

      alert(
        error?.message ||
        JSON.stringify(error) ||
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
            Please upload a copy of the participant's identification
            document and a signed DNR request document.
          </p>
        </div>

        {/* ID Document Upload */}
        <div className="mb-8">

          <label className="block text-sm font-medium text-slate-700 mb-3">
            South African Identification Document
          </label>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center">

            <div className="text-5xl mb-4">
              🪪
            </div>

            <p className="font-medium text-slate-800 mb-2">
              Upload Identification Document
            </p>

            <p className="text-slate-500 text-sm mb-4">
              South African ID Card, ID Book or Passport
            </p>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) =>
                setIdDocument(e.target.files?.[0] || null)
              }
              className="mt-2 block w-full text-sm text-slate-500"
            />

            {idDocument && (
              <div className="mt-4 text-green-700 font-medium">
                ✓ {idDocument.name} selected
              </div>
            )}

          </div>

        </div>

        {/* DNR Upload */}
        <div className="mb-10">

          <label className="block text-sm font-medium text-slate-700 mb-3">
            Signed DNR Request
          </label>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center">

            <div className="text-5xl mb-4">
              📄
            </div>

            <p className="font-medium text-slate-800 mb-2">
              Upload Signed DNR Request
            </p>

            <p className="text-slate-500 text-sm mb-4">
              PDF, JPG or PNG
            </p>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) =>
                setDnrDocument(e.target.files?.[0] || null)
              }
              className="mt-2 block w-full text-sm text-slate-500"
            />

            {dnrDocument && (
              <div className="mt-4 text-green-700 font-medium">
                ✓ {dnrDocument.name} selected
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
            Download a blank DNR template that can be completed,
            signed and uploaded as part of this registration process.
          </p>

          <button className="bg-slate-900 text-white px-8 py-3 rounded-xl">
            Download DNR Template
          </button>

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
            className="w-2/3 bg-slate-900 text-white py-4 rounded-xl text-center"
          >
            Continue to Consent & Acknowledgement
          </button>

        </div>

      </div>
    </main>
  );
}