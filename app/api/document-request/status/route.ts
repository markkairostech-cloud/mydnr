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

    const {
      data: documentRequest,
      error,
    } = await supabase
      .from("document_requests")
      .select(
        "id, payment_status, paid_at"
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