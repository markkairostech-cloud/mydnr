import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const identificationType = String(
      searchParams.get("identificationType") || "sa_id"
    ).trim();

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("dnr_registrations")
      .select("id")
      .eq("payment_status", "paid")
      .eq("registration_status", "active");

    if (identificationType === "sa_id") {
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

      query = query.eq("sa_id_number", saIdNumber);
    } else if (identificationType === "passport") {
      const passportNumber = String(
        searchParams.get("passportNumber") || ""
      ).trim();

      const passportCountry = String(
        searchParams.get("passportCountry") || ""
      ).trim();

      if (!passportNumber) {
        return NextResponse.json(
          {
            success: false,
            error: "A Passport Number is required.",
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
            error: "Passport Country of Issue is required.",
          },
          {
            status: 400,
          }
        );
      }

      query = query
        .eq("passport_number", passportNumber)
        .eq("passport_country", passportCountry);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "A valid identification type is required.",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await query.limit(1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      exists: Boolean(data && data.length > 0),
    });
  } catch (error: any) {
    console.error(
      "DNR CHECK ERROR:",
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