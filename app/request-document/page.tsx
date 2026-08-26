"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function RequestDocumentPage() {
  const [saIdNumber, setSaIdNumber] = useState("");
  const [requestorName, setRequestorName] = useState("");
  const [requestorEmail, setRequestorEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const idFromCheck =
      params.get("saIdNumber") || "";

    if (/^\d{13}$/.test(idFromCheck)) {
      setSaIdNumber(idFromCheck);
    }
  }, []);

  const handleContinue = async () => {
    const cleanedId = saIdNumber.trim();
    const cleanedName = requestorName.trim();
    const cleanedEmail =
      requestorEmail.trim().toLowerCase();

    if (!cleanedId) {
      alert(
        "Please enter the participant's South African ID Number."
      );
      return;
    }

    if (!/^\d{13}$/.test(cleanedId)) {
      alert(
        "Please enter a valid 13-digit South African ID Number."
      );
      return;
    }

    if (!cleanedName) {
      alert(
        "Please enter your Full Name."
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

    if (!confirmed) {
      alert(
        "Please confirm that you have a legitimate reason for requesting access to this document."
      );
      return;
    }

    try {
      setProcessing(true);

      const requestData = {
        saIdNumber: cleanedId,
        requestorName: cleanedName,
        requestorEmail: cleanedEmail,
        consentConfirmed: true,
      };

      // Step 1: Create document request
      const requestResponse = await fetch(
        "/api/document-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const requestResult =
        await requestResponse.json();

      if (
        !requestResponse.ok ||
        !requestResult.success
      ) {
        throw new Error(
          requestResult.error ||
            "Unable to create document request."
        );
      }

      const requestId =
        requestResult.requestId;

      if (!requestId) {
        throw new Error(
          "Document request ID was not returned."
        );
      }

      const storedRequestData = {
        ...requestData,
        requestId,
      };

      localStorage.setItem(
        "mydnr-document-request",
        JSON.stringify(storedRequestData)
      );

      // Step 2: Create PayFast payment request
      const payfastResponse = await fetch(
        "/api/document-request/payfast/start",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId,
            requestorName: cleanedName,
            requestorEmail: cleanedEmail,
            saIdNumber: cleanedId,
          }),
        }
      );

      if (!payfastResponse.ok) {
        const errorText =
          await payfastResponse.text();

        throw new Error(
          errorText ||
            "Unable to create PayFast payment."
        );
      }

      const payfastData =
        await payfastResponse.json();

      if (
        !payfastData.payfastUrl ||
        !payfastData.fields
      ) {
        throw new Error(
          "Invalid PayFast payment response."
        );
      }

      // Step 3: Submit hidden form to PayFast
      const form =
        document.createElement("form");

      form.method = "POST";
      form.action = payfastData.payfastUrl;

      Object.entries(
        payfastData.fields
      ).forEach(([key, value]) => {
        const input =
          document.createElement("input");

        input.type = "hidden";
        input.name = key;
        input.value = String(value);

        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();

    } catch (error: any) {
      console.error(
        "DOCUMENT REQUEST PAYMENT ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to start document retrieval payment."
      );
    } finally {
      setProcessing(false);
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
            registered DNR document. A retrieval fee of R25 applies
            during testing.
          </p>

        </div>

        {/* SA ID Number */}
        <div className="mb-8">

          <label className="block text-xl font-semibold text-slate-800 mb-3">
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
            placeholder="_ _ _ _ _ _ _ _ _ _ _ _ _"
            maxLength={13}
            inputMode="numeric"
            className="w-full border border-slate-300 rounded-xl px-4 py-4 text-center text-xl tracking-[0.4em] font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
          />

          <p className="mt-3 text-base font-medium text-slate-700">
            Enter the participant&apos;s 13-digit South African ID Number
          </p>

        </div>

        {/* Your Full Name */}
        <div className="mb-8">

          <label className="block text-xl font-semibold text-slate-800 mb-3">
            Your Full Name
          </label>

          <input
            type="text"
            value={requestorName}
            onChange={(e) =>
              setRequestorName(e.target.value)
            }
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
            value={requestorEmail}
            onChange={(e) =>
              setRequestorEmail(e.target.value)
            }
            className="w-full border border-slate-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />

        </div>

        {/* Confirmation Checkbox */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10">

          <label className="flex items-start gap-4">

            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) =>
                setConfirmed(e.target.checked)
              }
              className="mt-1 h-5 w-5"
            />

            <span className="text-slate-700 leading-relaxed">
              I confirm that I have a legitimate reason for
              requesting access to this document.
            </span>

          </label>

        </div>

        {/* Fee Panel */}
        <div className="border border-slate-200 rounded-3xl p-10 mb-10 text-center">

          <p className="text-slate-600 mb-3">
            Document Retrieval Fee
          </p>

          <p className="text-5xl font-bold text-slate-900 mb-3">
            R25
          </p>

          <p className="text-slate-500">
            Test document retrieval fee
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
            the request, including the requestor&apos;s details, date
            and time of access.
          </p>

        </div>

        {/* Payment Button */}
        <button
          onClick={handleContinue}
          disabled={processing}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {processing
            ? "Connecting to PayFast..."
            : "Pay R25 & Continue"}
        </button>

      </div>
    </main>
  );
}