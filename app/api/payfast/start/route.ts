import { NextResponse } from "next/server";
import crypto from "crypto";

function pfHost(mode: string | undefined) {
  return mode === "live"
    ? "www.payfast.co.za"
    : "sandbox.payfast.co.za";
}

function encodePayFastValue(value: string) {
  return encodeURIComponent(value.trim()).replace(/%20/g, "+");
}

function buildSignature(
  params: Record<string, string>,
  passphrase?: string
) {
  const pairs = Object.entries(params)
    .filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        String(value).length > 0
    )
    .map(
      ([key, value]) =>
        `${key}=${encodePayFastValue(String(value))}`
    );

  if (passphrase && passphrase.trim()) {
    pairs.push(
      `passphrase=${encodePayFastValue(passphrase)}`
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
    const body = await req.json();

    const fullName = String(
      body?.fullName || ""
    ).trim();

    const email = String(
      body?.email || ""
    )
      .trim()
      .toLowerCase();

    const saIdNumber = String(
      body?.saIdNumber || ""
    ).trim();

    const registrationId = String(
      body?.registrationId || ""
    ).trim();

    if (
      !registrationId ||
      !fullName ||
      !email ||
      !saIdNumber
    ) {
      return new NextResponse(
        "Missing participant details",
        { status: 400 }
      );
    }

    const merchant_id = String(
      process.env.PAYFAST_MERCHANT_ID || ""
    ).trim();

    const merchant_key = String(
      process.env.PAYFAST_MERCHANT_KEY || ""
    ).trim();

    const passphrase = String(
      process.env.PAYFAST_PASSPHRASE || ""
    ).trim();

    const mode = String(
      process.env.PAYFAST_MODE || "sandbox"
    ).trim();

    const siteUrl = String(
      process.env.NEXT_PUBLIC_SITE_URL || ""
    )
      .trim()
      .replace(/\/$/, "");

    if (
      !merchant_id ||
      !merchant_key ||
      !siteUrl
    ) {
      return new NextResponse(
        "Server not configured",
        { status: 500 }
      );
    }

    const amount = "25.00";

    const m_payment_id = registrationId;

    const return_url =
      `${siteUrl}/register/complete?registrationId=${encodeURIComponent(
        registrationId
      )}`;

    const cancel_url =
      `${siteUrl}/register/payment`;

    const notify_url =
      `${siteUrl}/api/payfast/itn`;

    const payfastUrl =
      `https://${pfHost(mode)}/eng/process`;

    const fields: Record<string, string> = {
      merchant_id,
      merchant_key,

      return_url,
      cancel_url,
      notify_url,

      name_first: fullName,
      email_address: email,

      m_payment_id,
      amount,

      item_name: "MyDNR Registration",
      item_description:
        "DNR Registration Fee",

      custom_str1: saIdNumber,
      custom_str2: email,
      custom_str3: fullName,
      custom_str4: registrationId,
    };

    const signature = buildSignature(
      fields,
      passphrase
    );

    return NextResponse.json({
      payfastUrl,
      fields: {
        ...fields,
        signature,
      },
    });
  } catch {
    return new NextResponse(
      "Bad request",
      { status: 400 }
    );
  }
}