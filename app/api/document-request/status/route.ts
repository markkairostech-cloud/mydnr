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

    const { data, error } = await supabase
      .from("document_requests")
      .select(
        "id, payment_status, payment_reference, paid_at"
      )
      .eq("id", requestId)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      request: data,
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
          error?.message ||
          "Unable to check document request status",
      },
      {
        status: 500,
      }
    );
  }
}