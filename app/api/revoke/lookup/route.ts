import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type IdentificationType = "SA_ID" | "PASSPORT";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const identificationType = String(
      searchParams.get("identificationType") || ""
    )
      .trim()
      .toUpperCase() as IdentificationType;

    const saIdNumber = String(
      searchParams.get("saIdNumber") || ""
    ).trim();

    const passportNumber = String(
      searchParams.get("passportNumber") || ""
    ).trim();

    const passportCountry = String(
      searchParams.get("passportCountry") || ""
    ).trim();

    if (
      identificationType !== "SA_ID" &&
      identificationType !== "PASSPORT"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid identification type.",
        },
        {
          status: 400,
        }
      );
    }

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

    if (
      identificationType === "PASSPORT" &&
      (!passportNumber || !passportCountry)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Passport Number and Country of Issue are required.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabaseAdmin();

    let registrationQuery = supabase
      .from("dnr_registrations")
      .select("id")
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

    const { data, error } =
      await registrationQuery.limit(1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      exists: Boolean(
        data && data.length > 0
      ),
    });
  } catch (error: any) {
    console.error(
      "DNR REVOCATION LOOKUP ERROR:",
      error?.message || error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to check DNR status.",
      },
      {
        status: 500,
      }
    );
  }
}