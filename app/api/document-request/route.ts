import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const saIdNumber = String(
      body?.saIdNumber || ""
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

    if (!requestorName) {
      return NextResponse.json(
        {
          success: false,
          error: "Requestor name is required.",
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
          error: "Requestor email is required.",
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

    const { data: registration, error: registrationError } =
      await supabase
        .from("dnr_registrations")
        .select("id")
        .eq("sa_id_number", saIdNumber)
        .eq("payment_status", "paid")
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
            "No paid DNR registration exists for this ID Number.",
        },
        {
          status: 404,
        }
      );
    }

    const { data, error } = await supabase
      .from("document_requests")
      .insert([
        {
          sa_id_number: saIdNumber,
          requestor_name: requestorName,
          requestor_email: requestorEmail,
          consent_confirmed: true,
          payment_status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      requestId: data.id,
    });
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