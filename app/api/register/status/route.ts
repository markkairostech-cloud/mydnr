import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const registrationId =
      searchParams.get("registrationId");

    if (!registrationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing registration ID",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("dnr_registrations")
      .select(
        "id, payment_status, payment_reference, paid_at"
      )
      .eq("id", registrationId)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      registration: data,
    });
  } catch (error: any) {
    console.error(
      "REGISTRATION STATUS ERROR:",
      error?.message || error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to check registration status",
      },
      {
        status: 500,
      }
    );
  }
}