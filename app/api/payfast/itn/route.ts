import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const EXPECTED_REGISTRATION_AMOUNT = 25.0;

function encodePayFastValue(value: string) {
  return encodeURIComponent(value.trim()).replace(/%20/g, "+");
}

function buildItnSignature(
  params: URLSearchParams,
  passphrase?: string
) {
  const pairs: string[] = [];

  /*
   * PayFast requires the ITN signature string to use
   * the exact order of the fields received.
   *
   * Stop when the signature field itself is reached.
   */
  for (const [key, value] of params.entries()) {
    if (key === "signature") {
      break;
    }

    if (
      value !== undefined &&
      value !== null &&
      value.length > 0
    ) {
      pairs.push(
        `${key}=${encodePayFastValue(value)}`
      );
    }
  }

  if (passphrase && passphrase.trim()) {
    pairs.push(
      `passphrase=${encodePayFastValue(
        passphrase
      )}`
    );
  }

  const paramString = pairs.join("&");

  return crypto
    .createHash("md5")
    .update(paramString)
    .digest("hex");
}

export async function POST(req: Request) {
  console.log("PAYFAST ITN: received");

  try {
    const body = await req.text();
    const params = new URLSearchParams(body);

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

    const configuredMerchantId = String(
      process.env.PAYFAST_MERCHANT_ID || ""
    ).trim();

    const passphrase = String(
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
     * 1. Payment must be complete
     */
    if (paymentStatus !== "COMPLETE") {
      console.log(
        "PAYFAST ITN: ignored - payment not complete"
      );

      return new NextResponse("Ignored", {
        status: 200,
      });
    }

    console.log(
      "PAYFAST ITN: payment status valid"
    );

    /*
     * 2. Required fields
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
     * 3. Merchant validation
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
        passphrase
      );

    if (
      calculatedSignature !==
      receivedSignature
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
      Number.parseFloat(amountGross);

    if (
      !Number.isFinite(receivedAmount) ||
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
     * 6. Registration lookup
     */
    const supabase = getSupabaseAdmin();

    const {
      data: registration,
      error: registrationError,
    } = await supabase
      .from("dnr_registrations")
      .select(
        "id, payment_status, payment_reference, paid_at"
      )
      .eq("id", registrationId)
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

    /*
     * 7. Idempotency
     */
    if (
      registration.payment_status ===
      "paid"
    ) {
      console.log(
        "PAYFAST ITN: already processed"
      );

      return new NextResponse(
        "Already processed",
        {
          status: 200,
        }
      );
    }

    /*
     * 8. Update registration
     */
    const { error: updateError } =
      await supabase
        .from("dnr_registrations")
        .update({
          payment_status: "paid",
          payment_reference:
            payfastPaymentId,
          paid_at:
            new Date().toISOString(),
        })
        .eq("id", registrationId)
        .neq(
          "payment_status",
          "paid"
        );

    if (updateError) {
      console.error(
        "PAYFAST ITN: database update failed:",
        updateError.message
      );

      throw updateError;
    }

    console.log(
      "PAYFAST ITN: registration marked paid"
    );

    console.log(
      "PAYFAST ITN: completed successfully"
    );

    return new NextResponse("OK", {
      status: 200,
    });

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