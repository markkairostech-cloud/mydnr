import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const EXPECTED_REGISTRATION_AMOUNT = 25.0;

/*
 * IMPORTANT:
 *
 * This encoder is specifically for the incoming PayFast ITN.
 *
 * Do not trim the incoming values here.
 * The ITN signature must be reconstructed from the values
 * PayFast actually posted to us.
 */
function encodePayFastItnValue(value: string) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

/*
 * Reconstruct the PayFast ITN parameter string.
 *
 * PayFast posts the fields in a specific order.
 * We preserve that order and stop when we reach "signature".
 */
function buildItnParameterString(
  params: URLSearchParams
) {
  const pairs: string[] = [];

  for (const [key, value] of params.entries()) {
    if (key === "signature") {
      break;
    }

    pairs.push(
      `${key}=${encodePayFastItnValue(value)}`
    );
  }

  return pairs.join("&");
}

/*
 * Calculate the expected PayFast ITN signature.
 */
function buildItnSignature(
  params: URLSearchParams,
  passphrase?: string
) {
  let paramString =
    buildItnParameterString(params);

  if (passphrase) {
    paramString +=
      `&passphrase=${encodePayFastItnValue(
        passphrase
      )}`;
  }

  return crypto
    .createHash("md5")
    .update(paramString)
    .digest("hex");
}

/*
 * Split a Supabase Storage object path into
 * folder + filename so that we can verify
 * whether the object still exists.
 */
function splitStoragePath(path: string) {
  const parts = path
    .split("/")
    .filter(Boolean);

  const fileName =
    parts.pop() || "";

  const folder =
    parts.join("/");

  return {
    folder,
    fileName,
  };
}

/*
 * Confirm whether a Storage object exists.
 */
async function storageObjectExists(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  bucket: string,
  path: string
) {
  const {
    folder,
    fileName,
  } = splitStoragePath(path);

  if (!fileName) {
    throw new Error(
      `Invalid Storage path supplied for bucket ${bucket}.`
    );
  }

  const {
    data,
    error,
  } = await supabase.storage
    .from(bucket)
    .list(
      folder || "",
      {
        limit: 100,
        search: fileName,
      }
    );

  if (error) {
    throw new Error(
      `Unable to verify Storage object in ${bucket}: ${error.message}`
    );
  }

  return Boolean(
    data?.some(
      (item) =>
        item.name === fileName
    )
  );
}

/*
 * Delete a Storage object and independently
 * verify that it has actually disappeared.
 *
 * If the object is already gone, that is
 * treated as success so that PayFast retries
 * can safely continue a partially completed
 * cleanup.
 */
async function ensureStorageObjectDeleted(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  bucket: string,
  path: string | null
) {
  if (!path) {
    return;
  }

  const existsBefore =
    await storageObjectExists(
      supabase,
      bucket,
      path
    );

  if (!existsBefore) {
    console.log(
      "PAYFAST ITN: Storage object already absent:",
      bucket,
      path
    );

    return;
  }

  const {
    error: deleteError,
  } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (deleteError) {
    throw new Error(
      `Unable to delete document from ${bucket}: ${deleteError.message}`
    );
  }

  const existsAfter =
    await storageObjectExists(
      supabase,
      bucket,
      path
    );

  if (existsAfter) {
    throw new Error(
      `Storage deletion could not be verified for ${bucket}.`
    );
  }
}

/*
 * Remove any older DNR registrations belonging
 * to the same SA ID number.
 *
 * IMPORTANT:
 *
 * Documents are deleted and verified FIRST.
 * Only after that do we delete the old database row.
 */
async function supersedeOlderRegistrations(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  currentRegistrationId: string,
  saIdNumber: string
) {
  const {
    data: olderRegistrations,
    error: olderRegistrationsError,
  } = await supabase
    .from("dnr_registrations")
    .select(
      `
        id,
        id_document_path,
        dnr_document_path,
        payment_status,
        registration_status
      `
    )
    .eq("sa_id_number", saIdNumber)
    .neq("id", currentRegistrationId)
    .neq("registration_status", "superseded");

  if (olderRegistrationsError) {
    throw olderRegistrationsError;
  }

  if (!olderRegistrations?.length) {
    console.log(
      "PAYFAST ITN: no older registrations require superseding"
    );
    return;
  }

  console.log(
    "PAYFAST ITN: older registrations to supersede:",
    olderRegistrations.length
  );

  for (const oldRegistration of olderRegistrations) {
    console.log(
      "PAYFAST ITN: superseding registration:",
      oldRegistration.id
    );

    // Delete and independently verify removal of the old sensitive documents.
    await ensureStorageObjectDeleted(
      supabase,
      "id-documents",
      oldRegistration.id_document_path
    );

    await ensureStorageObjectDeleted(
      supabase,
      "dnr-documents",
      oldRegistration.dnr_document_path
    );

    // Keep the historical DB row for audit/FK integrity, but make it
    // non-authoritative. The document-path columns are NOT NULL, so the
    // historical path values remain even though the Storage objects are gone.
    const {
      data: supersededRegistration,
      error: supersedeError,
    } = await supabase
      .from("dnr_registrations")
      .update({
        registration_status: "superseded",
      })
      .eq("id", oldRegistration.id)
      .neq("registration_status", "superseded")
      .select("id")
      .maybeSingle();

    if (supersedeError) {
      throw new Error(
        `Unable to mark registration ${oldRegistration.id} as superseded: ${supersedeError.message}`
      );
    }

    // A concurrent/retried ITN may already have completed this row.
    if (!supersededRegistration) {
      const {
        data: currentOldRegistration,
        error: currentOldRegistrationError,
      } = await supabase
        .from("dnr_registrations")
        .select("id, registration_status")
        .eq("id", oldRegistration.id)
        .maybeSingle();

      if (currentOldRegistrationError) {
        throw currentOldRegistrationError;
      }

      if (
        !currentOldRegistration ||
        currentOldRegistration.registration_status !== "superseded"
      ) {
        throw new Error(
          `Registration ${oldRegistration.id} could not be confirmed as superseded.`
        );
      }

      console.log(
        "PAYFAST ITN: registration already superseded:",
        oldRegistration.id
      );
      continue;
    }

    const { error: auditError } = await supabase
      .from("audit_logs")
      .insert([
        {
          event_type: "dnr_registration_superseded",
          sa_id_number: saIdNumber,
          registration_id: oldRegistration.id,
          previous_status:
            oldRegistration.registration_status || null,
          new_status: "superseded",
          documents_deleted: true,
          details:
            `Registration superseded by newer paid registration ${currentRegistrationId}. Historical registration metadata was retained for audit and referential integrity. Original identification and DNR documents were securely deleted and deletion was verified.`,
        },
      ]);

    if (auditError) {
      throw new Error(
        `Unable to create superseded-registration audit record: ${auditError.message}`
      );
    }

    console.log(
      "PAYFAST ITN: registration superseded:",
      oldRegistration.id
    );
  }
}

export async function POST(req: Request) {
  console.log("PAYFAST ITN: received");

  try {
    /*
     * Read the raw application/x-www-form-urlencoded
     * body sent by PayFast.
     */
    const body =
      await req.text();

    const params =
      new URLSearchParams(body);

    const paymentStatus =
      params.get("payment_status");

    const registrationId =
      params.get("m_payment_id");

    const payfastPaymentId =
      params.get("pf_payment_id");

    const receivedMerchantId =
      params.get("merchant_id");

    const amountGross =
      params.get("amount_gross");

    const receivedSignature =
      params.get("signature");

    const configuredMerchantId =
      String(
        process.env.PAYFAST_MERCHANT_ID || ""
      ).trim();

    const passphrase =
      String(
        process.env.PAYFAST_PASSPHRASE || ""
      ).trim();

    console.log(
      "PAYFAST ITN: payment status:",
      paymentStatus
    );

    console.log(
      "PAYFAST ITN: registration ID:",
      registrationId
    );

    /*
     * 1. Payment status
     */
    if (paymentStatus !== "COMPLETE") {
      console.log(
        "PAYFAST ITN: ignored - payment not complete"
      );

      return new NextResponse(
        "Ignored",
        {
          status: 200,
        }
      );
    }

    console.log(
      "PAYFAST ITN: payment status valid"
    );

    /*
     * 2. Required identifiers
     */
    if (!registrationId) {
      console.error(
        "PAYFAST ITN: rejected - missing registration ID"
      );

      return new NextResponse(
        "Missing registration ID",
        {
          status: 400,
        }
      );
    }

    if (!payfastPaymentId) {
      console.error(
        "PAYFAST ITN: rejected - missing PayFast payment ID"
      );

      return new NextResponse(
        "Missing PayFast payment ID",
        {
          status: 400,
        }
      );
    }

    console.log(
      "PAYFAST ITN: required IDs present"
    );

    /*
     * 3. Merchant ID validation
     */
    if (
      !configuredMerchantId ||
      !receivedMerchantId
    ) {
      console.error(
        "PAYFAST ITN: rejected - merchant ID unavailable"
      );

      return new NextResponse(
        "Merchant validation failed",
        {
          status: 400,
        }
      );
    }

    if (
      receivedMerchantId !==
      configuredMerchantId
    ) {
      console.error(
        "PAYFAST ITN: rejected - merchant ID mismatch"
      );

      return new NextResponse(
        "Invalid merchant",
        {
          status: 400,
        }
      );
    }

    console.log(
      "PAYFAST ITN: merchant ID valid"
    );

    /*
     * 4. Signature validation
     */
    if (!receivedSignature) {
      console.error(
        "PAYFAST ITN: rejected - missing signature"
      );

      return new NextResponse(
        "Missing signature",
        {
          status: 400,
        }
      );
    }

    const calculatedSignature =
      buildItnSignature(
        params,
        passphrase || undefined
      );

    if (
      calculatedSignature.toLowerCase() !==
      receivedSignature.toLowerCase()
    ) {
      console.error(
        "PAYFAST ITN: rejected - invalid signature"
      );

      return new NextResponse(
        "Invalid signature",
        {
          status: 400,
        }
      );
    }

    console.log(
      "PAYFAST ITN: signature valid"
    );

    /*
     * 5. Amount validation
     */
    if (!amountGross) {
      console.error(
        "PAYFAST ITN: rejected - missing payment amount"
      );

      return new NextResponse(
        "Missing payment amount",
        {
          status: 400,
        }
      );
    }

    const receivedAmount =
      Number.parseFloat(
        amountGross
      );

    if (
      !Number.isFinite(
        receivedAmount
      ) ||
      Math.abs(
        receivedAmount -
          EXPECTED_REGISTRATION_AMOUNT
      ) > 0.01
    ) {
      console.error(
        "PAYFAST ITN: rejected - amount mismatch:",
        amountGross
      );

      return new NextResponse(
        "Invalid payment amount",
        {
          status: 400,
        }
      );
    }

    console.log(
      "PAYFAST ITN: amount valid"
    );

    /*
     * 6. Find the incoming registration.
     *
     * We need the SA ID number because it becomes
     * the control key for removing older records.
     */
    const supabase =
      getSupabaseAdmin();

    const {
      data: registration,
      error: registrationError,
    } = await supabase
      .from("dnr_registrations")
      .select(
        `
          id,
          sa_id_number,
          payment_status,
          payment_reference,
          paid_at,
          registration_status
        `
      )
      .eq(
        "id",
        registrationId
      )
      .single();

    if (
      registrationError ||
      !registration
    ) {
      console.error(
        "PAYFAST ITN: rejected - registration not found:",
        registrationId
      );

      return new NextResponse(
        "Registration not found",
        {
          status: 404,
        }
      );
    }

    console.log(
      "PAYFAST ITN: registration found"
    );

    if (
      !registration.sa_id_number
    ) {
      throw new Error(
        "Registration does not contain a South African ID number."
      );
    }

    /*
     * 7. Payment idempotency.
     *
     * Unlike the old implementation, we DO NOT
     * immediately return if the registration is
     * already paid.
     *
     * A previous ITN attempt may have marked the
     * new registration paid and then failed while
     * cleaning old records. A PayFast retry must
     * therefore be allowed to finish that cleanup.
     */
    if (
      registration.payment_status !==
      "paid"
    ) {
      const paidAt =
        new Date().toISOString();

      const {
        data: paidRegistration,
        error: updateError,
      } = await supabase
        .from("dnr_registrations")
        .update({
          payment_status:
            "paid",

          payment_reference:
            payfastPaymentId,

          paid_at:
            paidAt,

          registration_status:
            "active",
        })
        .eq(
          "id",
          registrationId
        )
        .neq(
          "payment_status",
          "paid"
        )
        .select("id")
        .maybeSingle();

      if (
        updateError ||
        !paidRegistration
      ) {
        throw (
          updateError ||
          new Error(
            "Registration could not be marked as paid."
          )
        );
      }

      console.log(
        "PAYFAST ITN: registration marked paid"
      );
    } else {
      /*
       * Protect against a different PayFast payment
       * reference being used against an already-paid
       * registration.
       */
      if (
        registration.payment_reference &&
        registration.payment_reference !==
          payfastPaymentId
      ) {
        console.error(
          "PAYFAST ITN: rejected - payment reference does not match already-paid registration"
        );

        return new NextResponse(
          "Payment reference mismatch",
          {
            status: 409,
          }
        );
      }

      console.log(
        "PAYFAST ITN: registration already paid - continuing duplicate cleanup"
      );
    }

    /*
     * 8. Supersede every other registration belonging
     *    to this SA ID number.
     *
     * Historical rows remain for audit and foreign-key
     * integrity, while only the newly paid registration
     * remains authoritative.
     */
    await supersedeOlderRegistrations(
      supabase,
      registrationId,
      registration.sa_id_number
    );

    /*
     * 9. Final proof that there is exactly one
     *    authoritative paid + active registration
     *    for this SA ID, and that it is the newly
     *    paid registration.
     *
     * Historical superseded rows may remain by design.
     */
    const {
      data: authoritativeRegistrations,
      error: authoritativeError,
    } = await supabase
      .from("dnr_registrations")
      .select("id, payment_status, registration_status")
      .eq("sa_id_number", registration.sa_id_number)
      .eq("payment_status", "paid")
      .eq("registration_status", "active");

    if (authoritativeError) {
      throw authoritativeError;
    }

    if (
      !authoritativeRegistrations ||
      authoritativeRegistrations.length !== 1 ||
      authoritativeRegistrations[0].id !== registrationId
    ) {
      throw new Error(
        "Registration cleanup did not leave exactly one authoritative paid and active DNR registration."
      );
    }

    console.log(
      "PAYFAST ITN: one authoritative paid + active registration confirmed"
    );

    console.log(
      "PAYFAST ITN: completed successfully"
    );

    return new NextResponse(
      "OK",
      {
        status: 200,
      }
    );

  } catch (error: any) {
    console.error(
      "PAYFAST ITN ERROR:",
      error?.message || error
    );

    return new NextResponse(
      "Error",
      {
        status: 500,
      }
    );
  }
}