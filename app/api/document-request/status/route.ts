import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } =
      new URL(req.url);

    const requestId =
      String(
        searchParams.get("requestId") || ""
      ).trim();

    if (!requestId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing document request ID",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();

    /*
     * Retrieve the document request together with
     * the exact DNR registration it was created for.
     */
    const {
      data: documentRequest,
      error,
    } = await supabase
      .from("document_requests")
      .select(
        `
          id,
          registration_id,
          payment_status,
          paid_at
        `
      )
      .eq(
        "id",
        requestId
      )
      .maybeSingle();

    if (error) {
      throw error;
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
     * A document request must remain linked to
     * an exact DNR registration.
     */
    if (!documentRequest.registration_id) {
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
     * Once the document request itself has been paid,
     * the underlying DNR must still be a paid + active
     * authoritative registration.
     *
     * This prevents a previously-paid retrieval request
     * from continuing to appear available after the DNR
     * has been revoked or superseded.
     */
    if (
      documentRequest.payment_status === "paid" &&
      (
        registration.payment_status !== "paid" ||
        registration.registration_status !== "active"
      )
    ) {
      console.warn(
        "DOCUMENT REQUEST STATUS: linked registration is no longer active:",
        requestId,
        registration.id,
        registration.registration_status
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "The registered DNR record is no longer available for retrieval.",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json({
      success: true,

      request: {
        id:
          documentRequest.id,

        payment_status:
          documentRequest.payment_status,

        paid_at:
          documentRequest.paid_at,
      },
    });

  } catch (error: any) {
    console.error(
      "DOCUMENT REQUEST STATUS ERROR:",
      error?.message || error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to check document request status.",
      },
      {
        status: 500,
      }
    );
  }
}