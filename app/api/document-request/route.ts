import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const ACCESS_WINDOW_HOURS = 24;

type IdentificationType = "SA_ID" | "PASSPORT";

function hashAccessToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

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

    const requestorName = String(
      body?.requestorName || ""
    ).trim();

    const requestorEmail = String(
      body?.requestorEmail || ""
    )
      .trim()
      .toLowerCase();

    const consentConfirmed =
      body?.consentConfirmed === true;

    /*
     * Validate identity type.
     */
    if (
      identificationType !== "SA_ID" &&
      identificationType !== "PASSPORT"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please select a valid identification type.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validate South African ID.
     */
    if (
      identificationType === "SA_ID" &&
      !/^\d{13}$/.test(saIdNumber)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid 13-digit South African ID Number is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validate Passport.
     */
    if (identificationType === "PASSPORT") {
      if (!passportNumber) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A valid Passport Number is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!passportCountry) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Country of Issue is required.",
          },
          {
            status: 400,
          }
        );
      }
    }

    if (!requestorName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Requestor name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!requestorEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Requestor email is required.",
        },
        {
          status: 400,
        }
      );
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(requestorEmail)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid requestor email address is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!consentConfirmed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Confirmation is required before continuing.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabaseAdmin();

    /*
     * Find the current authoritative DNR registration.
     *
     * The lookup depends on whether the registration
     * uses a South African ID or Passport.
     */
    let registrationQuery = supabase
      .from("dnr_registrations")
      .select("id, created_at")
      .eq("payment_status", "paid")
      .eq("registration_status", "active");

    if (identificationType === "SA_ID") {
      registrationQuery =
        registrationQuery.eq(
          "sa_id_number",
          saIdNumber
        );
    } else {
      registrationQuery =
        registrationQuery
          .eq(
            "passport_number",
            passportNumber
          )
          .eq(
            "passport_country",
            passportCountry
          );
    }

    const {
      data: registration,
      error: registrationError,
    } = await registrationQuery
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (registrationError) {
      throw registrationError;
    }

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No active DNR registration exists for these identification details.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Generate a strong random access token.
     *
     * The plaintext token is only placed in the
     * HttpOnly cookie.
     *
     * Supabase stores only the SHA-256 hash.
     */
    const accessToken = crypto
      .randomBytes(32)
      .toString("hex");

    const accessTokenHash =
      hashAccessToken(accessToken);

    const accessExpiresAt = new Date(
      Date.now() +
        ACCESS_WINDOW_HOURS *
          60 *
          60 *
          1000
    ).toISOString();

    /*
     * Create the document retrieval request.
     */
    const {
      data,
      error,
    } = await supabase
      .from("document_requests")
      .insert([
        {
          identification_type:
            identificationType,

          sa_id_number:
            identificationType === "SA_ID"
              ? saIdNumber
              : null,

          passport_number:
            identificationType === "PASSPORT"
              ? passportNumber
              : null,

          passport_country:
            identificationType === "PASSPORT"
              ? passportCountry
              : null,

          requestor_name:
            requestorName,

          requestor_email:
            requestorEmail,

          consent_confirmed:
            true,

          payment_status:
            "pending",

          registration_id:
            registration.id,

          access_token_hash:
            accessTokenHash,

          access_expires_at:
            accessExpiresAt,
        },
      ])
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    /*
     * Return the request ID and store the
     * plaintext access token in a secure,
     * HttpOnly cookie.
     */
    const response =
      NextResponse.json({
        success: true,
        requestId: data.id,
      });

    response.cookies.set(
      "mydnr_document_access",
      accessToken,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite: "lax",

        path:
          "/api/document-request",

        maxAge:
          ACCESS_WINDOW_HOURS *
          60 *
          60,
      }
    );

    console.log(
      "DOCUMENT REQUEST: created securely:",
      data.id
    );

    return response;
  } catch (error: any) {
    console.error(
      "DOCUMENT REQUEST ERROR:",
      error?.message || error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Unable to create document request.",
      },
      {
        status: 500,
      }
    );
  }
}