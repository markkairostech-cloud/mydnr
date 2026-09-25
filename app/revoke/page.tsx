"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { COUNTRIES } from "@/lib/countries";

type IdentificationType =
  | "SA_ID"
  | "PASSPORT";

type LookupResult =
  | "found"
  | "not-found"
  | "error"
  | null;

export default function RevokeDNRPage() {
  const [currentStep, setCurrentStep] =
    useState<1 | 2 | 3 | 4 | 5>(1);

  const [
    identificationType,
    setIdentificationType,
  ] =
    useState<IdentificationType>("SA_ID");

  const [saIdNumber, setSaIdNumber] =
    useState("");

  const [passportNumber, setPassportNumber] =
    useState("");

  const [
    passportCountry,
    setPassportCountry,
  ] = useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [lookupResult, setLookupResult] =
    useState<LookupResult>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [idDocument, setIdDocument] =
    useState<File | null>(null);

  const [uploadError, setUploadError] =
    useState("");

  const [isUploading, setIsUploading] =
    useState(false);

  const [
    revocationRequestId,
    setRevocationRequestId,
  ] = useState<string | null>(null);

  const [isRevoking, setIsRevoking] =
    useState(false);

  const [
    revocationError,
    setRevocationError,
  ] = useState("");

  const [
    confirmsVoluntaryRevocation,
    setConfirmsVoluntaryRevocation,
  ] = useState(false);

  const [
    understandsConsequences,
    setUnderstandsConsequences,
  ] = useState(false);

  const [
    confirmsIdentityDocument,
    setConfirmsIdentityDocument,
  ] = useState(false);

  function resetLookupState() {
    setLookupResult(null);
    setErrorMessage("");
  }

  function handleIdentificationTypeChange(
    type: IdentificationType
  ) {
    setIdentificationType(type);
    resetLookupState();

    setIdDocument(null);
    setUploadError("");
    setRevocationRequestId(null);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    resetLookupState();

    const cleanedSaId =
      saIdNumber.trim();

    const cleanedPassport =
      passportNumber.trim();

    const cleanedCountry =
      passportCountry.trim();

    if (
      identificationType === "SA_ID" &&
      !/^\d{13}$/.test(cleanedSaId)
    ) {
      setLookupResult("error");

      setErrorMessage(
        "Please enter a valid 13-digit South African ID number."
      );

      return;
    }

    if (
      identificationType === "PASSPORT" &&
      !cleanedPassport
    ) {
      setLookupResult("error");

      setErrorMessage(
        "Please enter your Passport Number."
      );

      return;
    }

    if (
      identificationType === "PASSPORT" &&
      !cleanedCountry
    ) {
      setLookupResult("error");

      setErrorMessage(
        "Please select the Country of Issue for your passport."
      );

      return;
    }

    try {
      setIsLoading(true);

      const params =
        new URLSearchParams();

      params.set(
        "identificationType",
        identificationType
      );

      if (
        identificationType === "SA_ID"
      ) {
        params.set(
          "saIdNumber",
          cleanedSaId
        );
      } else {
        params.set(
          "passportNumber",
          cleanedPassport
        );

        params.set(
          "passportCountry",
          cleanedCountry
        );
      }

      const response = await fetch(
        `/api/revoke/lookup?${params.toString()}`
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "Unable to check your DNR registration."
        );
      }

      if (result.exists) {
        setLookupResult("found");
      } else {
        setLookupResult("not-found");
      }
    } catch (error: any) {
      console.error(
        "REVOCATION LOOKUP ERROR:",
        error?.message || error
      );

      setLookupResult("error");

      setErrorMessage(
        error?.message ||
          "We were unable to check your DNR registration. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleIdChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setSaIdNumber(
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 13)
    );

    resetLookupState();
  }

  function handlePassportChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setPassportNumber(
      event.target.value
    );

    resetLookupState();
  }

  function handlePassportCountryChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    setPassportCountry(
      event.target.value
    );

    resetLookupState();
  }

  function handleContinueToVerification() {
    if (lookupResult !== "found") {
      return;
    }

    setCurrentStep(2);
    setUploadError("");
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setUploadError("");

    const file =
      event.target.files?.[0] || null;

    if (!file) {
      setIdDocument(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      setIdDocument(null);

      setUploadError(
        "Please upload a PDF, JPG, JPEG or PNG file."
      );

      event.target.value = "";
      return;
    }

    const maxFileSize =
      10 * 1024 * 1024;

    if (file.size > maxFileSize) {
      setIdDocument(null);

      setUploadError(
        "The identification document must be smaller than 10 MB."
      );

      event.target.value = "";
      return;
    }

    setIdDocument(file);
  }

  async function handleIdentityUpload(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setUploadError("");

    if (!idDocument) {
      setUploadError(
        identificationType === "SA_ID"
          ? "Please select your identification document."
          : "Please select your passport document."
      );

      return;
    }

    try {
      setIsUploading(true);

      const formData =
        new FormData();

      formData.append(
        "identificationType",
        identificationType
      );

      if (
        identificationType === "SA_ID"
      ) {
        formData.append(
          "saIdNumber",
          saIdNumber.trim()
        );
      } else {
        formData.append(
          "passportNumber",
          passportNumber.trim()
        );

        formData.append(
          "passportCountry",
          passportCountry.trim()
        );
      }

      formData.append(
        "idDocument",
        idDocument
      );

      const response = await fetch(
        "/api/revoke/upload-id",
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
            "Unable to upload your identification document."
        );
      }

      setRevocationRequestId(
        result.revocationRequestId
      );

      sessionStorage.setItem(
        "mydnr-revocation-request-id",
        result.revocationRequestId
      );

      sessionStorage.setItem(
        "mydnr-revocation-identification-type",
        identificationType
      );
    } catch (error: any) {
      console.error(
        "REVOCATION ID UPLOAD ERROR:",
        error?.message || error
      );

      setUploadError(
        error?.message ||
          "Unable to securely upload your identification document."
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleContinueToReview() {
    if (!revocationRequestId) {
      return;
    }

    setCurrentStep(3);
  }

  function handleContinueToConfirmation() {
    if (!revocationRequestId) {
      return;
    }

    setCurrentStep(4);
  }

  async function handleConfirmRevocation() {
    setRevocationError("");

    if (
      !revocationRequestId ||
      !confirmsVoluntaryRevocation ||
      !understandsConsequences ||
      !confirmsIdentityDocument
    ) {
      setRevocationError(
        "Please confirm all three statements before continuing."
      );

      return;
    }

    try {
      setIsRevoking(true);

      const response = await fetch(
        "/api/revoke/confirm",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            revocationRequestId,
            voluntaryRevocationConfirmed:
              confirmsVoluntaryRevocation,
            consequencesUnderstood:
              understandsConsequences,
            identityDocumentAttested:
              confirmsIdentityDocument,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.completed
      ) {
        throw new Error(
          result.error ||
            "Unable to complete your DNR revocation."
        );
      }

      sessionStorage.removeItem(
        "mydnr-revocation-request-id"
      );

      sessionStorage.removeItem(
        "mydnr-revocation-identification-type"
      );

      /*
       * Remove the old legacy key as well,
       * in case it exists from an earlier
       * version of the revoke journey.
       */
      sessionStorage.removeItem(
        "mydnr-revocation-sa-id"
      );

      setCurrentStep(5);
    } catch (error: any) {
      console.error(
        "DNR REVOCATION CONFIRM ERROR:",
        error?.message || error
      );

      setRevocationError(
        error?.message ||
          "Unable to complete your DNR revocation. Please try again."
      );
    } finally {
      setIsRevoking(false);
    }
  }

  const allDeclarationsConfirmed =
    confirmsVoluntaryRevocation &&
    understandsConsequences &&
    confirmsIdentityDocument;

  const identityDocumentLabel =
    identificationType === "SA_ID"
      ? "South African identity document or Smart ID card"
      : "passport";

  const identityDocumentShortLabel =
    identificationType === "SA_ID"
      ? "Identification Document"
      : "Passport Document";

  function getStepLabel() {
    if (currentStep === 1) {
      return "Identify your registration";
    }

    if (currentStep === 2) {
      return "Provide identity evidence";
    }

    if (currentStep === 3) {
      return "Review what revocation means";
    }

    if (currentStep === 4) {
      return "Final confirmation";
    }

    return "Revocation complete";
  }

  function getProgressWidth() {
    if (currentStep === 1) {
      return "w-1/5";
    }

    if (currentStep === 2) {
      return "w-2/5";
    }

    if (currentStep === 3) {
      return "w-3/5";
    }

    if (currentStep === 4) {
      return "w-4/5";
    }

    return "w-full";
  }

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
        <div className="mx-auto max-w-4xl px-5 py-9 sm:px-8 sm:py-12">

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-blue-600">
            Voluntary DNR Revocation
          </p>

          <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            Revoke Your DNR
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            If your wishes have changed, you can request the
            voluntary revocation of your registered DNR.
          </p>

        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">

        {/* STEP INDICATOR */}
        <div className="mb-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

            <span className="font-bold text-slate-900">
              Step {currentStep} of 5
            </span>

            <span className="text-sm text-slate-500">
              {getStepLabel()}
            </span>

          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-blue-100">
            <div
              className={`h-full rounded-full bg-blue-600 transition-all duration-300 ${getProgressWidth()}`}
            />
          </div>

        </div>

        {/* STEP 1 */}
        {currentStep === 1 && (
          <>
            <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)]">

              <div className="border-b border-blue-100 bg-[#f8fbff] px-6 py-7 sm:px-9 sm:py-8">

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                    1
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                      Locate Registration
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                      Find Your DNR Registration
                    </h2>

                    <p className="mt-3 leading-7 text-slate-600">
                      Enter the identification details used
                      when your DNR was registered so we can
                      locate your active DNR registration.
                    </p>
                  </div>

                </div>
              </div>

              <div className="px-6 py-8 sm:px-9 sm:py-10">

                <form onSubmit={handleSubmit}>

                  <fieldset>
                    <legend className="mb-3 block text-sm font-semibold text-slate-900">
                      Identification Type
                    </legend>

                    <div className="grid gap-3 sm:grid-cols-2">

                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-4 transition ${
                          identificationType === "SA_ID"
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                            : "border-blue-100 bg-white hover:border-blue-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="identificationType"
                          value="SA_ID"
                          checked={
                            identificationType === "SA_ID"
                          }
                          onChange={() =>
                            handleIdentificationTypeChange(
                              "SA_ID"
                            )
                          }
                          disabled={isLoading}
                          className="h-4 w-4 accent-blue-600"
                        />

                        <span className="text-sm font-semibold text-slate-900">
                          South African ID
                        </span>
                      </label>

                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-4 transition ${
                          identificationType === "PASSPORT"
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                            : "border-blue-100 bg-white hover:border-blue-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="identificationType"
                          value="PASSPORT"
                          checked={
                            identificationType === "PASSPORT"
                          }
                          onChange={() =>
                            handleIdentificationTypeChange(
                              "PASSPORT"
                            )
                          }
                          disabled={isLoading}
                          className="h-4 w-4 accent-blue-600"
                        />

                        <span className="text-sm font-semibold text-slate-900">
                          Passport
                        </span>
                      </label>

                    </div>
                  </fieldset>

                  {identificationType === "SA_ID" && (
                    <div className="mt-6">

                      <label
                        htmlFor="saIdNumber"
                        className="mb-2 block text-sm font-semibold text-slate-900"
                      >
                        South African ID Number
                      </label>

                      <input
                        id="saIdNumber"
                        name="saIdNumber"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={13}
                        value={saIdNumber}
                        onChange={handleIdChange}
                        placeholder="0000000000000"
                        disabled={isLoading}
                        className="w-full rounded-xl border border-blue-100 bg-white px-4 py-4 text-center text-xl font-semibold tracking-[0.18em] text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 sm:text-2xl sm:tracking-[0.28em]"
                      />

                      <div className="mt-2 flex items-start justify-between gap-4">

                        <p className="text-sm leading-6 text-slate-500">
                          Enter the 13-digit South African ID
                          Number used when your DNR was
                          registered.
                        </p>

                        <span className="shrink-0 text-xs font-semibold text-slate-400">
                          {saIdNumber.length}/13
                        </span>

                      </div>
                    </div>
                  )}

                  {identificationType === "PASSPORT" && (
                    <div className="mt-6 space-y-5">

                      <div>
                        <label
                          htmlFor="passportNumber"
                          className="mb-2 block text-sm font-semibold text-slate-900"
                        >
                          Passport Number
                        </label>

                        <input
                          id="passportNumber"
                          name="passportNumber"
                          type="text"
                          autoComplete="off"
                          value={passportNumber}
                          onChange={handlePassportChange}
                          disabled={isLoading}
                          className="w-full rounded-xl border border-blue-100 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Enter the Passport Number used when
                          your DNR was registered.
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
                          name="passportCountry"
                          value={passportCountry}
                          onChange={
                            handlePassportCountryChange
                          }
                          disabled={isLoading}
                          className="w-full rounded-xl border border-blue-100 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                          <option value="">
                            Select country
                          </option>

                          {COUNTRIES.map(
                            (country) => (
                              <option
                                key={country}
                                value={country}
                              >
                                {country}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-7 w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading
                      ? "Checking Registration..."
                      : "Find My DNR"}
                  </button>

                </form>

                {lookupResult === "found" && (
                  <div className="mt-7 rounded-2xl border border-blue-200 bg-blue-50/70 p-5 sm:p-6">

                    <div className="flex items-start gap-4">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                        ✓
                      </div>

                      <div className="flex-1">

                        <h3 className="font-bold text-slate-900">
                          Active DNR Registration Found
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          An active MyDNR registration was found
                          for the supplied identification
                          details. Before the revocation can
                          proceed, we need you to provide
                          identity evidence.
                        </p>

                        <button
                          type="button"
                          onClick={
                            handleContinueToVerification
                          }
                          className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700"
                        >
                          Continue to Identity Verification
                        </button>

                      </div>
                    </div>
                  </div>
                )}

                {lookupResult === "not-found" && (
                  <div className="mt-7 rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">

                    <div className="flex items-start gap-4">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                        i
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900">
                          No Active DNR Registration Found
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          We could not locate an active DNR
                          registration for the supplied
                          identification details.
                        </p>
                      </div>

                    </div>
                  </div>
                )}

                {lookupResult === "error" && (
                  <div
                    role="alert"
                    className="mt-7 rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:p-6"
                  >
                    <div className="flex items-start gap-4">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 font-bold text-rose-700">
                        !
                      </div>

                      <div>
                        <h3 className="font-bold text-rose-900">
                          Unable to Continue
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-rose-800">
                          {errorMessage}
                        </p>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            </div>

            <PrivacyNotice>
              We will not display any DNR document or personal
              registration information at this stage. Identity
              evidence is required before a revocation can proceed.
            </PrivacyNotice>
          </>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <>
            <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)]">

              <div className="border-b border-blue-100 bg-[#f8fbff] px-6 py-7 sm:px-9 sm:py-8">

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                    2
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                      Identity Protection
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                      Provide Identity Evidence
                    </h2>

                    <p className="mt-3 leading-7 text-slate-600">
                      To help protect your DNR from unauthorised
                      removal, please upload a clear copy of your
                      current {identityDocumentLabel}.
                    </p>
                  </div>

                </div>
              </div>

              <div className="px-6 py-8 sm:px-9 sm:py-10">

                {!revocationRequestId && (
                  <form onSubmit={handleIdentityUpload}>

                    <label
                      htmlFor="idDocument"
                      className="mb-3 block text-sm font-semibold text-slate-900"
                    >
                      {identityDocumentShortLabel}
                    </label>

                    <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-[#fbfdff] p-6 text-center sm:p-8">

                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                        ↑
                      </div>

                      <p className="font-bold text-slate-900">
                        {identificationType === "SA_ID"
                          ? "Upload your identification document"
                          : "Upload your passport document"}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        PDF, JPG, JPEG or PNG — maximum 10 MB
                      </p>

                      <input
                        id="idDocument"
                        name="idDocument"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        className="mt-5 block w-full text-sm text-slate-500 disabled:opacity-60"
                      />

                    </div>

                    {idDocument && (
                      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">

                        <p className="text-sm font-bold text-slate-900">
                          ✓ {identityDocumentShortLabel} selected
                        </p>

                        <p className="mt-1 break-all text-sm text-slate-600">
                          {idDocument.name}
                        </p>

                      </div>
                    )}

                    {uploadError && (
                      <div
                        role="alert"
                        className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4"
                      >
                        <p className="text-sm font-bold text-rose-900">
                          Unable to Upload
                        </p>

                        <p className="mt-1 text-sm leading-6 text-rose-800">
                          {uploadError}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={
                        isUploading ||
                        !idDocument
                      }
                      className="mt-7 w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUploading
                        ? "Uploading Securely..."
                        : identificationType === "SA_ID"
                          ? "Upload Identity Document"
                          : "Upload Passport Document"}
                    </button>

                  </form>
                )}

                {revocationRequestId && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6">

                    <div className="flex items-start gap-4">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                        ✓
                      </div>

                      <div className="flex-1">

                        <h3 className="font-bold text-slate-900">
                          Identity Evidence Received
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Your identity evidence has been
                          securely received and linked to this
                          revocation request.
                        </p>

                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          You can now continue to review what
                          revocation means before making your
                          final decision.
                        </p>

                        <button
                          type="button"
                          onClick={
                            handleContinueToReview
                          }
                          className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700"
                        >
                          Continue to Revocation Review
                        </button>

                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            <PrivacyNotice>
              Your identity evidence is stored securely in a
              private area and is used only as supporting
              evidence for this revocation request.
            </PrivacyNotice>

            <BackButton
              label="Back to Step 1"
              disabled={isUploading}
              onClick={() =>
                setCurrentStep(1)
              }
            />
          </>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <>
            <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)]">

              <div className="border-b border-blue-100 bg-[#f8fbff] px-6 py-7 sm:px-9 sm:py-8">

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                    3
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                      Before You Continue
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                      Review What Revocation Means
                    </h2>

                    <p className="mt-3 leading-7 text-slate-600">
                      Please take a moment to understand what
                      will happen if you choose to revoke your
                      registered DNR.
                    </p>
                  </div>

                </div>
              </div>

              <div className="space-y-4 px-6 py-8 sm:px-9 sm:py-10">

                <ReviewItem
                  title="Your registered DNR will no longer be active"
                >
                  Once the revocation is completed, MyDNR will
                  no longer report this registration as an
                  active DNR.
                </ReviewItem>

                <ReviewItem
                  title="Your DNR document will no longer be available"
                >
                  The registered DNR document will no longer
                  be available through the MyDNR document
                  retrieval service.
                </ReviewItem>

                <ReviewItem
                  title="Stored registration documents will be removed"
                >
                  When the revocation is completed, the DNR
                  document and identification document held
                  as part of the original registration will
                  be securely removed from MyDNR storage.
                </ReviewItem>

                <ReviewItem
                  title="A revocation audit record will be retained"
                >
                  MyDNR will retain a non-documentary audit
                  record of the completed revocation for seven
                  years. This provides evidence that the
                  revocation took place without retaining your
                  original DNR document.
                </ReviewItem>

                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-6">

                  <div className="flex items-start gap-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 font-bold text-amber-700">
                      !
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-950">
                        Important
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        Revoking your MyDNR registration removes
                        the DNR request held by MyDNR. It does
                        not itself make decisions about other
                        medical treatment, care plans or
                        healthcare instructions that may exist
                        elsewhere.
                      </p>
                    </div>

                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    handleContinueToConfirmation
                  }
                  disabled={
                    !revocationRequestId
                  }
                  className="mt-3 w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continue to Final Confirmation
                </button>

              </div>
            </div>

            <BackButton
              label="Back to Step 2"
              onClick={() =>
                setCurrentStep(2)
              }
            />
          </>
        )}

        {/* STEP 4 */}
        {currentStep === 4 && (
          <>
            <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)]">

              <div className="border-b border-blue-100 bg-[#f8fbff] px-6 py-7 sm:px-9 sm:py-8">

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                    4
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                      Final Decision
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                      Final Confirmation
                    </h2>

                    <p className="mt-3 leading-7 text-slate-600">
                      Before your DNR can be revoked, please
                      confirm each of the statements below.
                    </p>
                  </div>

                </div>
              </div>

              <div className="space-y-5 px-6 py-8 sm:px-9 sm:py-10">

                <Declaration
                  checked={
                    confirmsVoluntaryRevocation
                  }
                  disabled={isRevoking}
                  onChange={
                    setConfirmsVoluntaryRevocation
                  }
                >
                  I confirm that I am voluntarily requesting
                  the revocation of my registered DNR.
                </Declaration>

                <Declaration
                  checked={
                    understandsConsequences
                  }
                  disabled={isRevoking}
                  onChange={
                    setUnderstandsConsequences
                  }
                >
                  I understand that once completed, my
                  registered DNR will no longer be available
                  through MyDNR and the stored registration
                  documents will be removed.
                </Declaration>

                <Declaration
                  checked={
                    confirmsIdentityDocument
                  }
                  disabled={isRevoking}
                  onChange={
                    setConfirmsIdentityDocument
                  }
                >
                  I confirm that the identity evidence I
                  supplied belongs to me and was provided by
                  me for this revocation request.
                </Declaration>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6">

                  <div className="flex items-start gap-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 font-bold text-amber-700">
                      !
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-950">
                        Please Be Certain Before Continuing
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        Once the revocation process is completed,
                        this registered DNR will no longer be
                        active through MyDNR and the associated
                        registration documents will be removed.
                      </p>
                    </div>

                  </div>
                </div>

                {revocationError && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-rose-200 bg-rose-50 p-5"
                  >
                    <p className="font-bold text-rose-900">
                      Unable to Complete Revocation
                    </p>

                    <p className="mt-1 text-sm leading-6 text-rose-800">
                      {revocationError}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={
                    handleConfirmRevocation
                  }
                  disabled={
                    !allDeclarationsConfirmed ||
                    isRevoking
                  }
                  className="w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isRevoking
                    ? "Processing Revocation..."
                    : "Confirm DNR Revocation"}
                </button>

                {!allDeclarationsConfirmed &&
                  !isRevoking && (
                    <p className="text-center text-sm leading-6 text-slate-500">
                      Please confirm all three statements
                      before continuing.
                    </p>
                  )}

              </div>
            </div>

            <BackButton
              label="Back to Step 3"
              disabled={isRevoking}
              onClick={() =>
                setCurrentStep(3)
              }
            />
          </>
        )}

        {/* STEP 5 */}
        {currentStep === 5 && (
          <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)]">

            <div className="border-b border-blue-100 bg-[#eef6fd] px-6 py-9 text-center sm:px-9 sm:py-11">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white shadow-md">
                ✓
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
                Revocation Complete
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-950">
                Your DNR Has Been Revoked
              </h2>

              <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
                Your MyDNR registration is no longer active.
                The original registration documents and the
                temporary identity evidence supplied for this
                revocation have been securely removed.
              </p>

            </div>

            <div className="space-y-6 px-6 py-8 sm:px-9 sm:py-10">

              <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-6">

                <div className="flex items-start gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
                    i
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-950">
                      Revocation Record Retained
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      MyDNR will retain a non-documentary audit
                      record of this completed revocation for
                      seven years. Your original DNR document
                      and identification documents are not
                      retained as part of that audit record.
                    </p>
                  </div>

                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-6">

                <h3 className="font-bold text-slate-950">
                  If Your Wishes Change Again
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  A revoked registration cannot be restored.
                  If you later decide that you want MyDNR to
                  hold a new DNR request, you will need to
                  complete a new registration.
                </p>

              </div>

              <div className="grid gap-3 sm:grid-cols-3">

                <CompletionItem>
                  Registration inactive
                </CompletionItem>

                <CompletionItem>
                  Documents removed
                </CompletionItem>

                <CompletionItem>
                  Audit retained
                </CompletionItem>

              </div>

              <Link
                href="/"
                className="block w-full rounded-xl bg-blue-600 px-6 py-4 text-center font-bold text-white shadow-md transition hover:bg-blue-700"
              >
                Return to MyDNR
              </Link>

            </div>
          </div>
        )}

        {/* RETURN HOME */}
        {currentStep !== 5 && (
          <div className="mt-7 text-center">

            <Link
              href="/"
              className="text-sm font-semibold text-slate-500 transition hover:text-blue-700"
            >
              ← Return to MyDNR
            </Link>

          </div>
        )}

      </section>

      {/* REASSURANCE */}
      <section className="border-t border-blue-100 bg-[#eef6fd]">

        <div className="mx-auto grid max-w-4xl gap-5 px-5 py-8 sm:grid-cols-3 sm:px-8">

          <ReassuranceItem>
            Identity protected
          </ReassuranceItem>

          <ReassuranceItem>
            Secure revocation
          </ReassuranceItem>

          <ReassuranceItem>
            Audit recorded
          </ReassuranceItem>

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

function PrivacyNotice({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">

      <div className="flex items-start gap-3">

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
          i
        </div>

        <p className="text-sm leading-6 text-slate-600">
          <span className="font-bold text-slate-800">
            Privacy notice:{" "}
          </span>

          {children}
        </p>

      </div>

    </div>
  );
}

function ReviewItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 sm:p-6">

      <div className="flex items-start gap-4">

        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          ✓
        </div>

        <div>
          <h3 className="font-bold text-slate-900">
            {title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {children}
          </p>
        </div>

      </div>

    </div>
  );
}

function Declaration({
  checked,
  disabled,
  onChange,
  children,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`block cursor-pointer rounded-2xl border p-5 transition sm:p-6 ${
        checked
          ? "border-blue-300 bg-blue-50/70"
          : "border-blue-100 bg-[#fbfdff] hover:border-blue-200"
      }`}
    >
      <div className="flex items-start gap-4">

        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              event.target.checked
            )
          }
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
        />

        <p className="font-medium leading-7 text-slate-700">
          {children}
        </p>

      </div>
    </label>
  );
}

function BackButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-5">

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full rounded-xl border border-blue-200 bg-white py-3.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ← {label}
      </button>

    </div>
  );
}

function CompletionItem({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-blue-50 px-4 py-4 text-center">

      <div className="text-blue-600">
        ✓
      </div>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {children}
      </p>

    </div>
  );
}

function ReassuranceItem({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="text-center">

      <div className="text-lg text-blue-600">
        ✓
      </div>

      <p className="mt-1 text-sm font-semibold text-slate-900">
        {children}
      </p>

    </div>
  );
}