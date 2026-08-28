import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const EXPECTED_RETRIEVAL_AMOUNT = 100.0;
const ACCESS_WINDOW_HOURS = 24;

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
 * Preserve the order in which PayFast sent the fields
 * and stop when we reach the signature field.
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

export async function POST(req: Request) {
  console.log(
    "DOCUMENT REQUEST ITN: received"
  );

  try {
    /*
     * Read the raw form body sent by PayFast.
     */
    const body = await req.text();

    const params =
      new URLSearchParams(body);

    const paymentStatus =
      params.get("payment_status");

    const requestId =
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
      "DOCUMENT REQUEST ITN: payment status:",
      paymentStatus
    );

    console.log(
      "DOCUMENT REQUEST ITN: request ID:",
      requestId
    );

    /*
     * 1. Payment must be complete.
     */
    if (paymentStatus !== "COMPLETE") {
      console.log(
        "DOCUMENT REQUEST ITN: ignored - payment not complete"
      );

      return new NextResponse(
        "Ignored",
        {
          status: 200,
        }
      );
    }

    console.log(
      "DOCUMENT REQUEST ITN: payment status valid"
    );

    /*
     * 2. Required identifiers.
     */
    if (!requestId) {
      console.error(
        "DOCUMENT REQUEST ITN: rejected - missing request ID"
      );

      return new NextResponse(
        "Missing request ID",
        {
          status: 400,
        }
      );
    }

    if (!payfastPaymentId) {
      console.error(
        "DOCUMENT REQUEST ITN: rejected - missing PayFast payment ID"
      );

      return new NextResponse(
        "Missing PayFast payment ID",
        {
          status: 400,
        }
      );
    }

    console.log(
      "DOCUMENT REQUEST ITN: required IDs present"
    );

    /*
     * 3. Merchant ID validation.
     */
    if (
      !configuredMerchantId ||
      !receivedMerchantId
    ) {
      console.error(
        "DOCUMENT REQUEST ITN: rejected - merchant ID unavailable"
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
        "DOCUMENT REQUEST ITN: rejected - merchant ID mismatch"
      );

      return new NextResponse(
        "Invalid merchant",
        {
          status: 400,
        }
      );
    }

    console.log(
      "DOCUMENT REQUEST ITN: merchant ID valid"
    );

    /*
     * 4. Signature validation.
     */
    if (!receivedSignature) {
      console.error(
        "DOCUMENT REQUEST ITN: rejected - missing signature"
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
        "DOCUMENT REQUEST ITN: rejected - invalid signature"
      );

      return new NextResponse(
        "Invalid signature",
        {
          status: 400,
        }
      );
    }

    console.log(
      "DOCUMENT REQUEST ITN: signature valid"
    );

    /*
     * 5. Amount validation.
     */
    if (!amountGross) {
      console.error(
        "DOCUMENT REQUEST ITN: rejected - missing payment amount"
      );

      return new NextResponse(
        "Missing payment amount",
        {
          status: 400,
        }
      );
    }

    const receivedAmount =
      Number.parseFloat(amountGross);

    if (
      !Number.isFinite(receivedAmount) ||
      Math.abs(
        receivedAmount -
          EXPECTED_RETRIEVAL_AMOUNT
      ) > 0.01
    ) {
      console.error(
        "DOCUMENT REQUEST ITN: rejected - amount mismatch:",
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
      "DOCUMENT REQUEST ITN: amount valid"
    );

    /*
     * 6. Find the document request.
     */
    const supabase =
      getSupabaseAdmin();

    const {
      data: documentRequest,
      error: requestError,
    } = await supabase
      .from("document_requests")
      .select(
        `
          id,
          registration_id,
          payment_status,
          payment_reference,
          paid_at
        `
      )
      .eq(
        "id",
        requestId
      )
      .maybeSingle();

    if (requestError) {
      throw requestError;
    }

    if (!documentRequest) {
      console.error(
        "DOCUMENT REQUEST ITN: rejected - request not found:",
        requestId
      );

      return new NextResponse(
        "Document request not found",
        {
          status: 404,
        }
      );
    }

    console.log(
      "DOCUMENT REQUEST ITN: request found"
    );

    /*
     * 7. The retrieval request must still be linked
     *    to an exact DNR registration.
     */
    if (!documentRequest.registration_id) {
      console.error(
        "DOCUMENT REQUEST ITN: rejected - request has no registration ID:",
        requestId
      );

      return new NextResponse(
        "Registration not linked",
        {
          status: 403,
        }
      );
    }

    /*
     * 8. The linked DNR must still be the current
     *    authoritative paid + active registration.
     *
     * This check happens at payment confirmation time,
     * not only when the request was originally created.
     */
    const {
      data: registration,
      error: registrationError,
    } = await supabase
      .from("dnr_registrations")
      .select(
        `
          id,
          payment_status,
          registration_status
        `
      )
      .eq(
        "id",
        documentRequest.registration_id
      )
      .maybeSingle();

    if (registrationError) {
      throw registrationError;
    }

    if (!registration) {
      console.error(
        "DOCUMENT REQUEST ITN: rejected - linked registration not found:",
        requestId,
        documentRequest.registration_id
      );

      return new NextResponse(
        "Registration not found",
        {
          status: 404,
        }
      );
    }

    if (
      registration.payment_status !== "paid" ||
      registration.registration_status !== "active"
    ) {
      console.warn(
        "DOCUMENT REQUEST ITN: rejected - linked registration is no longer active:",
        requestId,
        registration.id,
        registration.registration_status
      );

      return new NextResponse(
        "DNR registration no longer available",
        {
          status: 403,
        }
      );
    }

    /*
     * 9. Idempotency.
     *
     * If already paid, verify that the same PayFast
     * payment reference is being replayed.
     */
    if (
      documentRequest.payment_status ===
      "paid"
    ) {
      if (
        documentRequest.payment_reference &&
        documentRequest.payment_reference !==
          payfastPaymentId
      ) {
        console.error(
          "DOCUMENT REQUEST ITN: rejected - payment reference mismatch:",
          requestId
        );

        return new NextResponse(
          "Payment reference mismatch",
          {
            status: 409,
          }
        );
      }

      console.log(
        "DOCUMENT REQUEST ITN: already processed"
      );

      return new NextResponse(
        "Already processed",
        {
          status: 200,
        }
      );
    }

    /*
     * 10. Start the secure retrieval window
     *     from the moment payment is confirmed.
     */
    const paidAt =
      new Date();

    const accessExpiresAt =
      new Date(
        paidAt.getTime() +
          ACCESS_WINDOW_HOURS *
            60 *
            60 *
            1000
      );

    /*
     * 11. Mark the document request as paid
     *     and start the 24-hour access window.
     */
    const {
      data: updatedRequest,
      error: updateError,
    } = await supabase
      .from("document_requests")
      .update({
        payment_status: "paid",

        payment_reference:
          payfastPaymentId,

        paid_at:
          paidAt.toISOString(),

        access_expires_at:
          accessExpiresAt.toISOString(),
      })
      .eq(
        "id",
        requestId
      )
      .neq(
        "payment_status",
        "paid"
      )
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error(
        "DOCUMENT REQUEST ITN: database update failed:",
        updateError.message
      );

      throw updateError;
    }

    if (!updatedRequest) {
      console.warn(
        "DOCUMENT REQUEST ITN: request was not updated - possible concurrent processing:",
        requestId
      );

      return new NextResponse(
        "Already processed",
        {
          status: 200,
        }
      );
    }

    console.log(
      "DOCUMENT REQUEST ITN: document request marked paid"
    );

    console.log(
      "DOCUMENT REQUEST ITN: secure access expires:",
      accessExpiresAt.toISOString()
    );

    console.log(
      "DOCUMENT REQUEST ITN: completed successfully"
    );

    return new NextResponse(
      "OK",
      {
        status: 200,
      }
    );

  } catch (error: any) {
    console.error(
      "DOCUMENT REQUEST ITN ERROR:",
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