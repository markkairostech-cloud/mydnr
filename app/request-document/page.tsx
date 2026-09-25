"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { COUNTRIES } from "@/lib/countries";

type IdentificationType = "sa_id" | "passport";

export default function RequestDocumentPage() {
  const [identificationType, setIdentificationType] =
    useState<IdentificationType>("sa_id");

  const [saIdNumber, setSaIdNumber] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportCountry, setPassportCountry] = useState("");

  const [requestorName, setRequestorName] = useState("");
  const [requestorEmail, setRequestorEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const typeFromCheck =
      params.get("identificationType") || "";

    const saIdFromCheck =
      params.get("saIdNumber") || "";

    const passportFromCheck =
      params.get("passportNumber") || "";

    const countryFromCheck =
      params.get("passportCountry") || "";

    if (
      typeFromCheck === "sa_id" &&
      /^\d{13}$/.test(saIdFromCheck)
    ) {
      setIdentificationType("sa_id");
      setSaIdNumber(saIdFromCheck);
    }

    if (
      typeFromCheck === "passport" &&
      passportFromCheck &&
      countryFromCheck
    ) {
      setIdentificationType("passport");
      setPassportNumber(passportFromCheck);
      setPassportCountry(countryFromCheck);
    }
  }, []);

  const handleContinue = async () => {
    setErrorMessage("");

    const cleanedSaId = saIdNumber.trim();
    const cleanedPassportNumber =
      passportNumber.trim();
    const cleanedPassportCountry =
      passportCountry.trim();

    const cleanedName = requestorName.trim();

    const cleanedEmail =
      requestorEmail.trim().toLowerCase();

    /*
     * Validate the selected identity.
     */
    if (identificationType === "sa_id") {
      if (!cleanedSaId) {
        setErrorMessage(
          "Please enter the South African ID Number of the person whose DNR document you are requesting."
        );
        return;
      }

      if (!/^\d{13}$/.test(cleanedSaId)) {
        setErrorMessage(
          "Please enter a valid 13-digit South African ID Number."
        );
        return;
      }
    }

    if (identificationType === "passport") {
      if (!cleanedPassportNumber) {
        setErrorMessage(
          "Please enter the Passport Number of the person whose DNR document you are requesting."
        );
        return;
      }

      if (!cleanedPassportCountry) {
        setErrorMessage(
          "Please select the Country of Issue."
        );
        return;
      }
    }

    if (!cleanedName) {
      setErrorMessage(
        "Please enter your Full Name."
      );
      return;
    }

    if (!cleanedEmail) {
      setErrorMessage(
        "Please enter your Email Address."
      );
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanedEmail)) {
      setErrorMessage(
        "Please enter a valid Email Address."
      );
      return;
    }

    if (!confirmed) {
      setErrorMessage(
        "Please confirm that you have a legitimate need to access this DNR document and understand that your request will be recorded."
      );
      return;
    }

    try {
      setProcessing(true);

      /*
       * API values use the database identity names.
       */
      const apiIdentificationType =
        identificationType === "sa_id"
          ? "SA_ID"
          : "PASSPORT";

      const requestData = {
        identificationType:
          apiIdentificationType,

        saIdNumber:
          identificationType === "sa_id"
            ? cleanedSaId
            : "",

        passportNumber:
          identificationType === "passport"
            ? cleanedPassportNumber
            : "",

        passportCountry:
          identificationType === "passport"
            ? cleanedPassportCountry
            : "",

        requestorName: cleanedName,
        requestorEmail: cleanedEmail,
        consentConfirmed: true,
      };

      /*
       * Step 1: Create document request.
       */
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

      /*
       * Step 2: Create PayFast payment request.
       */
      const payfastResponse = await fetch(
        "/api/document-request/payfast/start",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            requestId,

            requestorName:
              cleanedName,

            requestorEmail:
              cleanedEmail,

            identificationType:
              apiIdentificationType,

            saIdNumber:
              identificationType === "sa_id"
                ? cleanedSaId
                : "",

            passportNumber:
              identificationType === "passport"
                ? cleanedPassportNumber
                : "",

            passportCountry:
              identificationType === "passport"
                ? cleanedPassportCountry
                : "",
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

      /*
       * Step 3: Submit hidden form to PayFast.
       */
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

      setErrorMessage(
        error?.message ||
          "Unable to start document retrieval payment."
      );
    } finally {
      setProcessing(false);
    }
  };

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f9fd] text-slate-950">
      {/* HEADER */}
      <header className="border-b border-blue-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            aria-label="Back to MyDNR home"
          >
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
            Secure Document Retrieval
          </p>

          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            Request a DNR Document
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Securely request access to a DNR document
            registered with MyDNR.
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
                ↓
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                  Document Retrieval Request
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Request a Registered DNR
                </h2>

                <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                  This service helps loved ones, caregivers and
                  healthcare practitioners request access to a
                  person&apos;s registered DNR wishes when they may
                  be unable to communicate them themselves.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-9 sm:py-10">
            {/* PROCESS EXPLANATION */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  i
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    Secure document access
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Enter the details below to request the
                    registered DNR document. Your request will
                    be recorded for security and audit purposes.
                  </p>
                </div>
              </div>
            </div>

            {/* INLINE ERROR */}
            {errorMessage && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 font-bold text-rose-700">
                    !
                  </div>

                  <div>
                    <p className="font-bold text-rose-900">
                      Unable to Continue
                    </p>

                    <p className="mt-1 text-sm leading-6 text-rose-800">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* REQUEST DETAILS */}
            <div>
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                  DNR Record
                </p>

                <h3 className="mt-2 text-xl font-bold text-slate-950">
                  Whose DNR document are you requesting?
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Select the identification document used when
                  the DNR was registered.
                </p>
              </div>

              {/* IDENTIFICATION TYPE */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Identification Type
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentificationType("sa_id");
                      setPassportNumber("");
                      setPassportCountry("");
                      clearError();
                    }}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      identificationType === "sa_id"
                        ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                        : "border-blue-100 bg-white text-slate-700 hover:border-blue-200"
                    }`}
                  >
                    South African ID
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIdentificationType("passport");
                      setSaIdNumber("");
                      clearError();
                    }}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      identificationType === "passport"
                        ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                        : "border-blue-100 bg-white text-slate-700 hover:border-blue-200"
                    }`}
                  >
                    Passport
                  </button>
                </div>
              </div>

              {/* SA ID */}
              {identificationType === "sa_id" && (
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
                      const value =
                        e.target.value.replace(/\D/g, "");

                      setSaIdNumber(
                        value.slice(0, 13)
                      );

                      clearError();
                    }}
                    placeholder="0000000000000"
                    maxLength={13}
                    inputMode="numeric"
                    autoComplete="off"
                    className="w-full rounded-xl border border-blue-100 bg-white px-4 py-4 text-center text-xl font-semibold tracking-[0.18em] text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:text-2xl sm:tracking-[0.28em]"
                  />

                  <div className="mt-2 flex items-start justify-between gap-4">
                    <p className="text-sm leading-6 text-slate-500">
                      Enter the 13-digit South African ID Number
                      of the person whose DNR document you are
                      requesting.
                    </p>

                    <span className="shrink-0 text-xs font-semibold text-slate-400">
                      {saIdNumber.length}/13
                    </span>
                  </div>
                </div>
              )}

              {/* PASSPORT */}
              {identificationType === "passport" && (
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="passportNumber"
                      className="mb-2 block text-sm font-semibold text-slate-900"
                    >
                      Passport Number
                    </label>

                    <input
                      id="passportNumber"
                      type="text"
                      value={passportNumber}
                      onChange={(e) => {
                        setPassportNumber(
                          e.target.value
                        );
                        clearError();
                      }}
                      autoComplete="off"
                      className="w-full rounded-xl border border-blue-100 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Enter the Passport Number used when the
                      DNR was registered.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="passportCountry"
                      className="mb-2 block text-sm font-semibold text-slate-900"
                    >
                      Country of Issue
                    </label>

                    <select
                      id="passportCountry"
                      value={passportCountry}
                      onChange={(e) => {
                        setPassportCountry(
                          e.target.value
                        );
                        clearError();
                      }}
                      className="w-full rounded-xl border border-blue-100 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">
                        Select country of issue
                      </option>

                      {COUNTRIES.map((country) => (
                        <option
                          key={country}
                          value={country}
                        >
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-blue-100" />

            {/* REQUESTOR DETAILS */}
            <div>
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                  Your Details
                </p>

                <h3 className="mt-2 text-xl font-bold text-slate-950">
                  Who is requesting the document?
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  These details form part of the security and
                  audit record for this request.
                </p>
              </div>

              <div className="space-y-6">
                {/* FULL NAME */}
                <div>
                  <label
                    htmlFor="requestorName"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    Your Full Name
                  </label>

                  <input
                    id="requestorName"
                    type="text"
                    value={requestorName}
                    onChange={(e) => {
                      setRequestorName(
                        e.target.value
                      );
                      clearError();
                    }}
                    autoComplete="name"
                    className="w-full rounded-xl border border-blue-100 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="requestorEmail"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    Email Address
                  </label>

                  <input
                    id="requestorEmail"
                    type="email"
                    value={requestorEmail}
                    onChange={(e) => {
                      setRequestorEmail(
                        e.target.value
                      );
                      clearError();
                    }}
                    autoComplete="email"
                    className="w-full rounded-xl border border-blue-100 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Your email address will be recorded with
                    this document request.
                  </p>
                </div>
              </div>
            </div>

            {/* CONFIRMATION */}
            <label
              className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition sm:p-6 ${
                confirmed
                  ? "border-blue-300 bg-blue-50/70"
                  : "border-blue-100 bg-[#fbfdff] hover:border-blue-200"
              }`}
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => {
                  setConfirmed(
                    e.target.checked
                  );
                  clearError();
                }}
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-blue-600"
              />

              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Required Confirmation
                </p>

                <span className="text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
                  I confirm that I am requesting this DNR
                  document because I have a legitimate need
                  to access it and understand that this request
                  will be recorded for security and audit
                  purposes.
                </span>
              </div>
            </label>

            {/* FEE PANEL */}
            <div className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/60">
              <div className="p-7 text-center sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                  Document Retrieval Fee
                </p>

                <div className="mt-3 flex items-baseline justify-center">
                  <span className="text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
                    R100
                  </span>
                </div>

                <p className="mt-2 font-semibold text-slate-700">
                  One-time document retrieval fee
                </p>

                <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600">
                  Payment is required before the registered
                  DNR document can be released through the
                  MyDNR retrieval process.
                </p>
              </div>

              <div className="border-t border-blue-100 bg-white/60 px-6 py-4 text-center">
                <p className="text-xs leading-5 text-slate-500">
                  You will be transferred to PayFast to
                  complete your payment securely.
                </p>
              </div>
            </div>

            {/* IMPORTANT NOTICE */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 font-bold text-amber-700">
                  !
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    Important Notice
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
                    All document retrieval requests are
                    recorded for audit and security purposes.
                    MyDNR may retain a record of the request,
                    including the requestor&apos;s details,
                    date and time of access.
                  </p>
                </div>
              </div>
            </div>

            {/* PAYMENT BUTTON */}
            <div className="border-t border-blue-100 pt-7">
              <button
                type="button"
                onClick={handleContinue}
                disabled={processing}
                className="w-full rounded-xl bg-blue-600 px-6 py-4 text-center font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing
                  ? "Connecting to PayFast..."
                  : "Pay R100 & Continue"}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                Your document request is recorded before
                you are transferred to PayFast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-4xl px-5 pb-10 sm:px-8 sm:pb-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-white p-5 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              1
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-900">
              Submit Request
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Provide the DNR identification details and your
              requestor details.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              2
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-900">
              Pay Securely
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Complete the R100 retrieval payment
              through PayFast.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              3
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-900">
              Secure Retrieval
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Continue through the MyDNR document
              retrieval process.
            </p>
          </div>
        </div>
      </section>

      {/* REASSURANCE */}
      <section className="border-t border-blue-100 bg-[#eef6fd]">
        <div className="mx-auto grid max-w-4xl gap-5 px-5 py-8 sm:grid-cols-3 sm:px-8">
          <div className="text-center">
            <div className="text-lg text-blue-600">
              ✓
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              Secure request
            </p>
          </div>

          <div className="text-center">
            <div className="text-lg text-blue-600">
              ✓
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              Audit recorded
            </p>
          </div>

          <div className="text-center">
            <div className="text-lg text-blue-600">
              ✓
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              PayFast checkout
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
            <Link
              href="/privacy"
              className="hover:text-blue-700"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="hover:text-blue-700"
            >
              Terms
            </Link>

            <Link
              href="/disclaimer"
              className="hover:text-blue-700"
            >
              Disclaimer
            </Link>

            <Link
              href="/contact"
              className="hover:text-blue-700"
            >
              Contact
            </Link>

            <Link
              href="/about"
              className="hover:text-blue-700"
            >
              About
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}