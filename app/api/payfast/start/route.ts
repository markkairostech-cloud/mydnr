import { NextResponse } from "next/server";
import crypto from "crypto";

type IdentificationType = "SA_ID" | "PASSPORT";

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

    const registrationId = String(
      body?.registrationId || ""
    ).trim();

    const identificationType = String(
      body?.identificationType || ""
    )
      .trim()
      .toUpperCase() as IdentificationType;

    const saIdNumber = String(
      body?.saIdNumber || ""
    ).trim();

    const passportNumber = String(
      body?.passportNumber || ""
    ).trim();

    const passportCountry = String(
      body?.passportCountry || ""
    ).trim();

    /*
     * Validate the core payment details.
     */
    if (
      !registrationId ||
      !fullName ||
      !email
    ) {
      return new NextResponse(
        "Missing participant details",
        { status: 400 }
      );
    }

    /*
     * Validate the selected identity type.
     */
    if (
      identificationType !== "SA_ID" &&
      identificationType !== "PASSPORT"
    ) {
      return new NextResponse(
        "Invalid identification type",
        { status: 400 }
      );
    }

    /*
     * Validate the identity fields belonging
     * to the selected identification type.
     */
    if (
      identificationType === "SA_ID" &&
      !saIdNumber
    ) {
      return new NextResponse(
        "Missing South African ID number",
        { status: 400 }
      );
    }

    if (
      identificationType === "PASSPORT" &&
      (
        !passportNumber ||
        !passportCountry
      )
    ) {
      return new NextResponse(
        "Missing passport details",
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

    /*
     * MyDNR registration fee.
     */
    const amount = "400.00";

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

    /*
     * IMPORTANT:
     *
     * The registration ID is the authoritative
     * reference connecting PayFast back to MyDNR.
     *
     * Identity information is included only as
     * supplementary metadata. The ITN must retrieve
     * the authoritative identity from the database
     * using m_payment_id / registrationId.
     */
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

      custom_str1:
        identificationType,

      custom_str2:
        identificationType === "SA_ID"
          ? saIdNumber
          : passportNumber,

      custom_str3:
        identificationType === "PASSPORT"
          ? passportCountry
          : "",

      custom_str4:
        registrationId,
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