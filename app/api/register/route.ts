import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("dnr_registrations")
      .insert([
        {
          full_name: body.fullName,
          sa_id_number: body.saIdNumber,
          date_of_birth: body.dateOfBirth,
          email: body.email,
          mobile_number: body.mobileNumber,
          next_of_kin_name: body.nextOfKinName,
          next_of_kin_phone: body.nextOfKinPhone,
          id_document_path: body.idDocumentPath,
          dnr_document_path: body.dnrDocumentPath,
        },
      ]);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}