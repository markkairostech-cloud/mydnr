"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type LookupResult =
  | "found"
  | "not-found"
  | "error"
  | null;

export default function RevokeDNRPage() {
  const [currentStep, setCurrentStep] =
    useState<1 | 2 | 3 | 4 | 5>(1);

  const [saIdNumber, setSaIdNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResult, setLookupResult] =
    useState<LookupResult>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [idDocument, setIdDocument] =
    useState<File | null>(null);

  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [revocationRequestId, setRevocationRequestId] =
    useState<string | null>(null);

  const [isRevoking, setIsRevoking] = useState(false);
  const [revocationError, setRevocationError] = useState("");

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

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLookupResult(null);
    setErrorMessage("");

    if (!/^\d{13}$/.test(saIdNumber)) {
      setLookupResult("error");

      setErrorMessage(
        "Please enter a valid 13-digit South African ID number."
      );

      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/revoke/lookup?saIdNumber=${encodeURIComponent(
          saIdNumber
        )}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
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
      event.target.value.replace(/\D/g, "")
    );

    setLookupResult(null);
    setErrorMessage("");
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
        "Please select your identification document."
      );

      return;
    }

    try {
      setIsUploading(true);

      const formData =
        new FormData();

      formData.append(
        "saIdNumber",
        saIdNumber
      );

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

      if (!response.ok || !result.success) {
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
        "mydnr-revocation-sa-id",
        saIdNumber
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
            "Content-Type": "application/json",
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
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Logo */}
        <div className="flex justify-center mb-1">
          <Image
            src="/images/mydnr-logo.png"
            alt="MyDNR South Africa"
            width={450}
            height={450}
            priority
            style={{
              width: "auto",
              height: "auto",
            }}
          />
        </div>

        {/* Header */}
        <section className="text-center mb-10">

          <p className="text-sm font-semibold text-blue-700 mb-2">
            Voluntary DNR Revocation
          </p>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Revoke Your DNR
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            If your wishes have changed, you can request the voluntary
            revocation of your registered DNR.
          </p>

        </section>

        {/* Step Indicator */}
        <section className="mb-8">

          <div className="flex items-center justify-between text-sm text-slate-500 mb-3">

            <span className="font-semibold text-slate-900">
              Step {currentStep} of 5
            </span>

            <span>
              {getStepLabel()}
            </span>

          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">

            <div
              className={`h-full bg-slate-900 rounded-full transition-all ${getProgressWidth()}`}
            />

          </div>

        </section>

        {/* STEP 1 */}
        {currentStep === 1 && (
          <>

            <section className="border border-slate-200 rounded-3xl p-7 md:p-10 shadow-sm">

              <div className="mb-8">

                <div className="text-4xl mb-4">
                  🔍
                </div>

                <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                  Find Your DNR Registration
                </h2>

                <p className="text-slate-600 leading-relaxed">
                  Enter your 13-digit South African ID number so we can
                  locate your active DNR registration.
                </p>

              </div>

              <form onSubmit={handleSubmit}>

                <label
                  htmlFor="saIdNumber"
                  className="block font-medium text-slate-800 mb-2"
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
                  placeholder="Enter your 13-digit ID number"
                  disabled={isLoading}
                  className="
                    w-full
                    border
                    border-slate-300
                    rounded-xl
                    px-4
                    py-3
                    text-slate-900
                    outline-none
                    focus:ring-2
                    focus:ring-slate-900
                    focus:border-transparent
                    disabled:bg-slate-100
                    disabled:cursor-not-allowed
                  "
                />

                <p className="text-sm text-slate-500 mt-2">
                  Your ID number is used only to locate your existing
                  MyDNR registration.
                </p>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    mt-7
                    w-full
                    bg-slate-900
                    text-white
                    py-3
                    rounded-xl
                    font-medium
                    hover:bg-slate-800
                    transition
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                  "
                >
                  {isLoading
                    ? "Checking..."
                    : "Find My DNR"}
                </button>

              </form>

              {lookupResult === "found" && (
                <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">

                  <div className="flex gap-3">

                    <div className="text-2xl">
                      ✓
                    </div>

                    <div className="flex-1">

                      <h3 className="font-semibold text-slate-900 mb-1">
                        Active DNR Registration Found
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        An active MyDNR registration was found for this
                        ID number. Before the revocation can proceed,
                        we need you to provide identity evidence.
                      </p>

                      <button
                        type="button"
                        onClick={
                          handleContinueToVerification
                        }
                        className="
                          mt-5
                          w-full
                          bg-slate-900
                          text-white
                          py-3
                          rounded-xl
                          font-medium
                          hover:bg-slate-800
                          transition
                        "
                      >
                        Continue to Identity Verification
                      </button>

                    </div>

                  </div>

                </div>
              )}

              {lookupResult === "not-found" && (
                <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">

                  <div className="flex gap-3">

                    <div className="text-2xl">
                      ℹ️
                    </div>

                    <div>

                      <h3 className="font-semibold text-slate-900 mb-1">
                        No Active DNR Registration Found
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        We could not locate an active DNR registration
                        for this ID number.
                      </p>

                    </div>

                  </div>

                </div>
              )}

              {lookupResult === "error" && (
                <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">

                  <div className="flex gap-3">

                    <div className="text-2xl">
                      ⚠️
                    </div>

                    <div>

                      <h3 className="font-semibold text-slate-900 mb-1">
                        Unable to Continue
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        {errorMessage}
                      </p>

                    </div>

                  </div>

                </div>
              )}

            </section>

            <section className="bg-slate-50 rounded-2xl p-5 mt-6">

              <p className="text-sm text-slate-600 leading-relaxed">

                <span className="font-semibold text-slate-800">
                  Privacy notice:
                </span>{" "}

                We will not display any DNR document or personal
                registration information at this stage. Identity
                evidence is required before a revocation can proceed.

              </p>

            </section>

          </>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <>

            <section className="border border-slate-200 rounded-3xl p-7 md:p-10 shadow-sm">

              <div className="mb-8">

                <div className="text-4xl mb-4">
                  🪪
                </div>

                <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                  Provide Identity Evidence
                </h2>

                <p className="text-slate-600 leading-relaxed">
                  To help protect your DNR from unauthorised removal,
                  please upload a clear copy of your current South
                  African identity document or Smart ID card.
                </p>

              </div>

              {!revocationRequestId && (
                <form onSubmit={handleIdentityUpload}>

                  <label
                    htmlFor="idDocument"
                    className="block font-medium text-slate-800 mb-2"
                  >
                    Identification Document
                  </label>

                  <input
                    id="idDocument"
                    name="idDocument"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={
                      handleFileChange
                    }
                    disabled={isUploading}
                    className="
                      block
                      w-full
                      border
                      border-slate-300
                      rounded-xl
                      px-4
                      py-3
                      text-slate-700
                      bg-white
                      disabled:bg-slate-100
                      disabled:cursor-not-allowed
                    "
                  />

                  <p className="text-sm text-slate-500 mt-2">
                    Accepted formats: PDF, JPG, JPEG or PNG. Maximum
                    file size: 10 MB.
                  </p>

                  {idDocument && (
                    <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4">

                      <p className="text-sm font-medium text-slate-800">
                        Selected file
                      </p>

                      <p className="text-sm text-slate-600 mt-1 break-all">
                        {idDocument.name}
                      </p>

                    </div>
                  )}

                  {uploadError && (
                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">

                      <p className="text-sm font-semibold text-slate-900">
                        Unable to upload
                      </p>

                      <p className="text-sm text-slate-600 mt-1">
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
                    className="
                      mt-7
                      w-full
                      bg-slate-900
                      text-white
                      py-3
                      rounded-xl
                      font-medium
                      hover:bg-slate-800
                      transition
                      disabled:opacity-60
                      disabled:cursor-not-allowed
                    "
                  >
                    {isUploading
                      ? "Uploading Securely..."
                      : "Upload and Continue"}
                  </button>

                </form>
              )}

              {revocationRequestId && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">

                  <div className="flex gap-3">

                    <div className="text-2xl">
                      ✓
                    </div>

                    <div className="flex-1">

                      <h3 className="font-semibold text-slate-900 mb-2">
                        Identity Evidence Received
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        Your identification document has been securely
                        received and linked to this revocation request.
                      </p>

                      <p className="text-sm text-slate-600 leading-relaxed mt-3">
                        For this MVP, providing the document allows you
                        to continue with the revocation process.
                      </p>

                      <button
                        type="button"
                        onClick={
                          handleContinueToReview
                        }
                        className="
                          mt-5
                          w-full
                          bg-slate-900
                          text-white
                          py-3
                          rounded-xl
                          font-medium
                          hover:bg-slate-800
                          transition
                        "
                      >
                        Continue
                      </button>

                    </div>

                  </div>

                </div>
              )}

            </section>

            <section className="bg-slate-50 rounded-2xl p-5 mt-6">

              <p className="text-sm text-slate-600 leading-relaxed">

                <span className="font-semibold text-slate-800">
                  Privacy notice:
                </span>{" "}

                Your identification document is stored securely in a
                private area and is used only as supporting evidence
                for this revocation request.

              </p>

            </section>

            <div className="text-center mt-6">

              <button
                type="button"
                onClick={() => {
                  if (!isUploading) {
                    setCurrentStep(1);
                  }
                }}
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                ← Back to Step 1
              </button>

            </div>

          </>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <>

            <section className="border border-slate-200 rounded-3xl p-7 md:p-10 shadow-sm">

              <div className="mb-8">

                <div className="text-4xl mb-4">
                  📋
                </div>

                <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                  Review What Revocation Means
                </h2>

                <p className="text-slate-600 leading-relaxed">
                  Before you continue, please take a moment to understand
                  what will happen if you choose to revoke your registered
                  DNR.
                </p>

              </div>

              <div className="space-y-4">

                <div className="rounded-2xl border border-slate-200 p-5">

                  <div className="flex gap-4">

                    <div className="text-xl">
                      ✓
                    </div>

                    <div>

                      <h3 className="font-semibold text-slate-900 mb-1">
                        Your registered DNR will no longer be active
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        Once the revocation is completed, MyDNR will no
                        longer report this registration as an active DNR.
                      </p>

                    </div>

                  </div>

                </div>

                <div className="rounded-2xl border border-slate-200 p-5">

                  <div className="flex gap-4">

                    <div className="text-xl">
                      🔒
                    </div>

                    <div>

                      <h3 className="font-semibold text-slate-900 mb-1">
                        Your DNR document will no longer be available
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        The registered DNR document will no longer be
                        available through the MyDNR document retrieval
                        service.
                      </p>

                    </div>

                  </div>

                </div>

                <div className="rounded-2xl border border-slate-200 p-5">

                  <div className="flex gap-4">

                    <div className="text-xl">
                      🗑️
                    </div>

                    <div>

                      <h3 className="font-semibold text-slate-900 mb-1">
                        Stored registration documents will be removed
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        When the revocation is completed, the DNR document
                        and identification document held as part of the
                        original registration will be securely removed
                        from MyDNR storage.
                      </p>

                    </div>

                  </div>

                </div>

                <div className="rounded-2xl border border-slate-200 p-5">

                  <div className="flex gap-4">

                    <div className="text-xl">
                      🧾
                    </div>

                    <div>

                      <h3 className="font-semibold text-slate-900 mb-1">
                        A revocation audit record will be retained
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        MyDNR will retain a non-documentary audit record
                        of the completed revocation for seven years. This
                        provides evidence that the revocation took place
                        without retaining your original DNR document.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

              <div className="mt-7 rounded-2xl bg-slate-50 p-5">

                <h3 className="font-semibold text-slate-900 mb-2">
                  Important
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Revoking your MyDNR registration removes the DNR request
                  held by MyDNR. It does not itself make decisions about
                  other medical treatment, care plans or healthcare
                  instructions that may exist elsewhere.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleContinueToConfirmation
                }
                disabled={!revocationRequestId}
                className="
                  mt-7
                  w-full
                  bg-slate-900
                  text-white
                  py-3
                  rounded-xl
                  font-medium
                  hover:bg-slate-800
                  transition
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                "
              >
                Continue to Revocation Confirmation
              </button>

            </section>

            <div className="text-center mt-6">

              <button
                type="button"
                onClick={() =>
                  setCurrentStep(2)
                }
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                ← Back to Step 2
              </button>

            </div>

          </>
        )}

        {/* STEP 4 */}
        {currentStep === 4 && (
          <>

            <section className="border border-slate-200 rounded-3xl p-7 md:p-10 shadow-sm">

              <div className="mb-8">

                <div className="text-4xl mb-4">
                  ✓
                </div>

                <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                  Final Confirmation
                </h2>

                <p className="text-slate-600 leading-relaxed">
                  Before your DNR can be revoked, please confirm each
                  of the statements below.
                </p>

              </div>

              <div className="space-y-4">

                {/* Declaration 1 */}
                <label className="block rounded-2xl border border-slate-200 p-5 cursor-pointer">

                  <div className="flex items-start gap-4">

                    <input
                      type="checkbox"
                      checked={
                        confirmsVoluntaryRevocation
                      }
                      disabled={isRevoking}
                      onChange={(event) =>
                        setConfirmsVoluntaryRevocation(
                          event.target.checked
                        )
                      }
                      className="
                        mt-1
                        h-5
                        w-5
                        min-w-5
                        shrink-0
                        rounded
                        border-slate-300
                        accent-slate-900
                        "
                    />

                    <div>

                      <p className="font-medium text-slate-900 leading-relaxed">
                        I confirm that I am voluntarily requesting the
                        revocation of my registered DNR.
                      </p>

                    </div>

                  </div>

                </label>

                {/* Declaration 2 */}
                <label className="block rounded-2xl border border-slate-200 p-5 cursor-pointer">

                  <div className="flex items-start gap-4">

                    <input
                      type="checkbox"
                      checked={
                        understandsConsequences
                      }
                      disabled={isRevoking}
                      onChange={(event) =>
                        setUnderstandsConsequences(
                          event.target.checked
                        )
                      }
                      className="
                          mt-1
                            h-5
                            w-5
                            min-w-5
                            shrink-0
                            rounded
                            border-slate-300
                            accent-slate-900
                      "
                    />

                    <div>

                      <p className="font-medium text-slate-900 leading-relaxed">
                        I understand that once completed, my registered
                        DNR will no longer be available through MyDNR
                        and the stored registration documents will be
                        removed.
                      </p>

                    </div>

                  </div>

                </label>

                {/* Declaration 3 */}
                <label className="block rounded-2xl border border-slate-200 p-5 cursor-pointer">

                  <div className="flex items-start gap-4">

                    <input
                      type="checkbox"
                      checked={
                        confirmsIdentityDocument
                      }
                      disabled={isRevoking}
                      onChange={(event) =>
                        setConfirmsIdentityDocument(
                          event.target.checked
                        )
                      }
                      className="
                        mt-1
                        h-5
                        w-5
                        min-w-5
                        shrink-0
                        rounded
                        border-slate-300
                        accent-slate-900
                      "
                    />

                    <div>

                      <p className="font-medium text-slate-900 leading-relaxed">
                        I confirm that the identification document I
                        supplied belongs to me and was provided by me
                        for this revocation request.
                      </p>

                    </div>

                  </div>

                </label>

              </div>

              {/* Warning */}
              <div className="mt-7 rounded-2xl bg-slate-50 p-5">

                <div className="flex gap-3">

                  <div className="text-xl">
                    ⚠️
                  </div>

                  <div>

                    <h3 className="font-semibold text-slate-900 mb-2">
                      Please be certain before continuing
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      Once the revocation process is completed, this
                      registered DNR will no longer be active through
                      MyDNR and the associated registration documents
                      will be removed.
                    </p>

                  </div>

                </div>

              </div>

              {/* Final Button */}
              <button
                type="button"
                onClick={handleConfirmRevocation}
                disabled={
                  !allDeclarationsConfirmed ||
                  isRevoking
                }
                className="
                  mt-7
                  w-full
                  bg-slate-900
                  text-white
                  py-3
                  rounded-xl
                  font-semibold
                  hover:bg-slate-800
                  transition
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                "
              >
                {isRevoking
                  ? "Processing Revocation..."
                  : "Confirm Revocation"}
              </button>

              {revocationError && (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-sm font-semibold text-slate-900">
                    Unable to complete revocation
                  </p>

                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    {revocationError}
                  </p>

                </div>
              )}

              {!allDeclarationsConfirmed && !isRevoking && (
                <p className="text-sm text-slate-500 text-center mt-3">
                  Please confirm all three statements before continuing.
                </p>
              )}

            </section>

            <div className="text-center mt-6">

              <button
                type="button"
                onClick={() => {
                  if (!isRevoking) {
                    setCurrentStep(3);
                  }
                }}
                disabled={isRevoking}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Back to Step 3
              </button>

            </div>

          </>
        )}

        {/* STEP 5 */}
        {currentStep === 5 && (
          <>

            <section className="border border-slate-200 rounded-3xl p-7 md:p-10 shadow-sm text-center">

              <div className="text-5xl mb-5">
                ✓
              </div>

              <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-4">
                Your DNR Has Been Revoked
              </h2>

              <p className="text-slate-600 leading-relaxed max-w-xl mx-auto">
                Your MyDNR registration is no longer active. The original
                registration documents and the temporary identity evidence
                supplied for this revocation have been securely removed.
              </p>

              <div className="mt-7 rounded-2xl bg-slate-50 p-5 text-left">

                <h3 className="font-semibold text-slate-900 mb-2">
                  Revocation record retained
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  MyDNR will retain a non-documentary audit record of this
                  completed revocation for seven years. Your original DNR
                  document and identification documents are not retained as
                  part of that audit record.
                </p>

              </div>

              <div className="mt-7 rounded-2xl border border-slate-200 p-5 text-left">

                <h3 className="font-semibold text-slate-900 mb-2">
                  If your wishes change again
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  A revoked registration cannot be restored. If you later
                  decide that you want MyDNR to hold a new DNR request, you
                  will need to complete a new registration.
                </p>

              </div>

              <Link
                href="/"
                className="
                  mt-7
                  inline-flex
                  w-full
                  items-center
                  justify-center
                  bg-slate-900
                  text-white
                  py-3
                  rounded-xl
                  font-semibold
                  hover:bg-slate-800
                  transition
                "
              >
                Return to MyDNR
              </Link>

            </section>

          </>
        )}

        {/* Return to MyDNR */}
        {currentStep !== 5 && (
          <div className="text-center mt-8">

          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Return to MyDNR
          </Link>

          </div>
        )}

      </div>
    </main>
  );
}