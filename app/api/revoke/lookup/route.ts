import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const saIdNumber = String(
      searchParams.get("saIdNumber") || ""
    ).trim();

    if (!/^\d{13}$/.test(saIdNumber)) {
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

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("dnr_registrations")
      .select("id")
      .eq("sa_id_number", saIdNumber)
      .eq("payment_status", "paid")
      .eq("registration_status", "active")
      .limit(1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      exists: Boolean(data && data.length > 0),
    });
  } catch (error: any) {
    console.error(
      "DNR REVOCATION LOOKUP ERROR:",
      error?.message || error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to check DNR status.",
      },
      {
        status: 500,
      }
    );
  }
}