import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const EXPECTED_RETRIEVAL_AMOUNT = 25.0;

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
     * 1. Payment must be complete
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
     * 2. Required identifiers
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
     * 3. Merchant ID validation
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
     * 4. Signature validation
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
     * 5. Amount validation
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
     * 6. Find the document request
     */
    const supabase =
      getSupabaseAdmin();

    const {
      data: documentRequest,
      error: requestError,
    } = await supabase
      .from("document_requests")
      .select(
        "id, payment_status, payment_reference, paid_at"
      )
      .eq(
        "id",
        requestId
      )
      .single();

    if (
      requestError ||
      !documentRequest
    ) {
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
     * 7. Idempotency
     *
     * Do not process the same payment twice.
     */
    if (
      documentRequest.payment_status ===
      "paid"
    ) {
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
     * 8. Mark the document request as paid
     */
    const {
      error: updateError,
    } = await supabase
      .from("document_requests")
      .update({
        payment_status: "paid",
        payment_reference:
          payfastPaymentId,
        paid_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        requestId
      )
      .neq(
        "payment_status",
        "paid"
      );

    if (updateError) {
      console.error(
        "DOCUMENT REQUEST ITN: database update failed:",
        updateError.message
      );

      throw updateError;
    }

    console.log(
      "DOCUMENT REQUEST ITN: document request marked paid"
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