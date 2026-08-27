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
   * URLSearchParams preserves the order in which PayFast
   * posted the fields.
   *
   * The signature field itself must not be included in
   * the calculated signature.
   */
  for (const [key, value] of params.entries()) {
    if (
      key === "signature" ||
      value === undefined ||
      value === null ||
      value.length === 0
    ) {
      continue;
    }

    pairs.push(
      `${key}=${encodePayFastValue(value)}`
    );
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

    /*
     * 1. Ignore notifications that do not represent
     *    a completed payment.
     */
    if (paymentStatus !== "COMPLETE") {
      console.log(
        "PayFast ITN ignored - payment not complete:",
        paymentStatus
      );

      return new NextResponse("Ignored", {
        status: 200,
      });
    }

    /*
     * 2. Required ITN fields.
     */
    if (!registrationId) {
      console.error(
        "PayFast ITN rejected - missing registration ID"
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
        "PayFast ITN rejected - missing PayFast payment ID"
      );

      return new NextResponse(
        "Missing PayFast payment ID",
        {
          status: 400,
        }
      );
    }

    if (
      !configuredMerchantId ||
      !receivedMerchantId
    ) {
      console.error(
        "PayFast ITN rejected - merchant ID unavailable"
      );

      return new NextResponse(
        "Merchant validation failed",
        {
          status: 400,
        }
      );
    }

    /*
     * 3. Verify merchant ID.
     */
    if (
      receivedMerchantId !==
      configuredMerchantId
    ) {
      console.error(
        "PayFast ITN rejected - merchant ID mismatch"
      );

      return new NextResponse(
        "Invalid merchant",
        {
          status: 400,
        }
      );
    }

    /*
     * 4. Verify ITN signature.
     */
    if (!receivedSignature) {
      console.error(
        "PayFast ITN rejected - missing signature"
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
        "PayFast ITN rejected - invalid signature"
      );

      return new NextResponse(
        "Invalid signature",
        {
          status: 400,
        }
      );
    }

    /*
     * 5. Verify payment amount.
     */
    if (!amountGross) {
      console.error(
        "PayFast ITN rejected - missing payment amount"
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
        "PayFast ITN rejected - amount mismatch:",
        amountGross
      );

      return new NextResponse(
        "Invalid payment amount",
        {
          status: 400,
        }
      );
    }

    /*
     * 6. Confirm that the registration exists.
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
        "PayFast ITN rejected - registration not found:",
        registrationId
      );

      return new NextResponse(
        "Registration not found",
        {
          status: 404,
        }
      );
    }

    /*
     * 7. Idempotency.
     *
     * PayFast can retry notifications. If we have
     * already successfully processed this registration,
     * simply acknowledge the ITN.
     */
    if (
      registration.payment_status ===
      "paid"
    ) {
      console.log(
        "PayFast ITN already processed:",
        registrationId
      );

      return new NextResponse(
        "Already processed",
        {
          status: 200,
        }
      );
    }

    /*
     * 8. Mark the registration as paid.
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
      throw updateError;
    }

    console.log(
      "PayFast registration payment confirmed:",
      registrationId
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