import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const requestId =
      searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing document request ID",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabaseAdmin();

    // Step 1: Confirm the retrieval request exists and is paid
    const {
      data: documentRequest,
      error: requestError,
    } = await supabase
      .from("document_requests")
      .select(
        "id, sa_id_number, payment_status"
      )
      .eq("id", requestId)
      .single();

    if (requestError) {
      throw requestError;
    }

    if (
      documentRequest.payment_status !== "paid"
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

    // Step 2: Find the paid DNR registration
    const {
      data: registration,
      error: registrationError,
    } = await supabase
      .from("dnr_registrations")
      .select(
        "id, dnr_document_path, payment_status"
      )
      .eq(
        "sa_id_number",
        documentRequest.sa_id_number
      )
      .eq("payment_status", "paid")
      .limit(1)
      .maybeSingle();

    if (registrationError) {
      throw registrationError;
    }

    if (
      !registration ||
      !registration.dnr_document_path
    ) {
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

    // Step 3: Generate a short-lived signed URL
    const {
      data: signedUrlData,
      error: signedUrlError,
    } = await supabase.storage
      .from("dnr-documents")
      .createSignedUrl(
        registration.dnr_document_path,
        300
      );

    if (signedUrlError) {
      throw signedUrlError;
    }

    return NextResponse.json({
      success: true,
      signedUrl: signedUrlData.signedUrl,
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
          error?.message ||
          "Unable to prepare document download.",
      },
      {
        status: 500,
      }
    );
  }
}