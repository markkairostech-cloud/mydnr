import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const SIGNED_URL_EXPIRY_SECONDS = 300;

function hashAccessToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function secureHashMatch(
  storedHash: string,
  suppliedHash: string
) {
  try {
    const storedBuffer =
      Buffer.from(storedHash, "hex");

    const suppliedBuffer =
      Buffer.from(suppliedHash, "hex");

    if (
      storedBuffer.length === 0 ||
      storedBuffer.length !==
        suppliedBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      storedBuffer,
      suppliedBuffer
    );
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } =
      new URL(req.url);

    const requestId =
      String(
        searchParams.get("requestId") || ""
      ).trim();

    /*
     * 1. A request ID is required.
     */
    if (!requestId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing document request ID.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 2. The browser must possess the secret
     *    HttpOnly access token created when the
     *    retrieval request was started.
     */
    const cookieStore =
      await cookies();

    const accessToken =
      cookieStore.get(
        "mydnr_document_access"
      )?.value;

    if (!accessToken) {
      console.warn(
        "DOCUMENT DOWNLOAD: missing access token:",
        requestId
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Secure access to this document request could not be verified.",
        },
        {
          status: 403,
        }
      );
    }

    const suppliedTokenHash =
      hashAccessToken(accessToken);

    const supabase =
      getSupabaseAdmin();

    /*
     * 3. Retrieve the specific document request.
     *
     * maybeSingle() allows us to return a clean 404
     * instead of converting a missing row into a 500.
     */
    const {
      data: documentRequest,
      error: requestError,
    } = await supabase
      .from("document_requests")
      .select(
        `
          id,
          registration_id,
          requestor_email,
          payment_status,
          access_token_hash,
          access_expires_at
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
      return NextResponse.json(
        {
          success: false,
          error:
            "Document request not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * 4. Payment must already be confirmed.
     */
    if (
      documentRequest.payment_status !==
      "paid"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment has not been confirmed for this document request.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * 5. The request must have been bound to
     *    an exact DNR registration.
     */
    if (
      !documentRequest.registration_id
    ) {
      console.error(
        "DOCUMENT DOWNLOAD: request has no registration ID:",
        requestId
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "This document request is not linked to a registered DNR record.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * 6. Verify the access token.
     *
     * Only the SHA-256 hash is stored in Supabase.
     */
    if (
      !documentRequest.access_token_hash
    ) {
      console.error(
        "DOCUMENT DOWNLOAD: request has no access token hash:",
        requestId
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Secure access to this document request could not be verified.",
        },
        {
          status: 403,
        }
      );
    }

    const tokenIsValid =
      secureHashMatch(
        documentRequest.access_token_hash,
        suppliedTokenHash
      );

    if (!tokenIsValid) {
      console.warn(
        "DOCUMENT DOWNLOAD: invalid access token:",
        requestId
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Secure access to this document request could not be verified.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * 7. Enforce the retrieval access window.
     */
    if (
      !documentRequest.access_expires_at
    ) {
      console.error(
        "DOCUMENT DOWNLOAD: request has no access expiry:",
        requestId
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "The secure retrieval window for this request is unavailable.",
        },
        {
          status: 403,
        }
      );
    }

    const accessExpiry =
      new Date(
        documentRequest.access_expires_at
      ).getTime();

    if (
      !Number.isFinite(accessExpiry) ||
      Date.now() > accessExpiry
    ) {
      console.warn(
        "DOCUMENT DOWNLOAD: access window expired:",
        requestId
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "The secure retrieval window for this document request has expired.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * 8. Retrieve the exact DNR registration
     *    linked to this document request.
     *
     * We no longer search using the SA ID Number,
     * which removes ambiguity if multiple historical
     * registrations exist for the same person.
     */
    const {
      data: registration,
      error: registrationError,
    } = await supabase
      .from("dnr_registrations")
      .select(
        "id, dnr_document_path, payment_status"
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
      return NextResponse.json(
        {
          success: false,
          error:
            "Registered DNR record could not be located.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * The underlying registration must also still
     * represent a successfully paid registration.
     */
    if (
      registration.payment_status !==
      "paid"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The registered DNR record is not available for retrieval.",
        },
        {
          status: 403,
        }
      );
    }

    if (!registration.dnr_document_path) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Registered DNR document could not be located.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * 9. Generate a short-lived signed URL.
     *
     * Only the DNR document bucket is accessed here.
     * The identification-document bucket is never
     * referenced by this route.
     */
    const {
      data: signedUrlData,
      error: signedUrlError,
    } = await supabase.storage
      .from("dnr-documents")
      .createSignedUrl(
        registration.dnr_document_path,
        SIGNED_URL_EXPIRY_SECONDS
      );

    if (
      signedUrlError ||
      !signedUrlData?.signedUrl
    ) {
      throw (
        signedUrlError ||
        new Error(
          "Secure document link could not be generated."
        )
      );
    }

    /*
     * 10. Audit the actual granting of access.
     *
     * Fail closed if the audit record cannot be written.
     * A sensitive DNR document should not be issued
     * without an accompanying audit event.
     */
    const {
      error: auditError,
    } = await supabase
      .from("document_access_audit")
      .insert([
        {
          request_id:
            documentRequest.id,

          registration_id:
            registration.id,

          requestor_email:
            documentRequest.requestor_email,

          event_type:
            "signed_url_issued",
        },
      ]);

    if (auditError) {
      console.error(
        "DOCUMENT DOWNLOAD AUDIT ERROR:",
        auditError.message
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Secure document access could not be recorded. Please try again.",
        },
        {
          status: 500,
        }
      );
    }

    console.log(
      "DOCUMENT DOWNLOAD: secure access granted:",
      requestId
    );

    /*
     * 11. Return only the temporary signed URL.
     */
    return NextResponse.json({
      success: true,
      signedUrl:
        signedUrlData.signedUrl,
    });

  } catch (error: any) {
    console.error(
      "DOCUMENT DOWNLOAD ERROR:",
      error?.message || error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to prepare document download.",
      },
      {
        status: 500,
      }
    );
  }
}