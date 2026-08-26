import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);

    const paymentStatus =
      params.get("payment_status");

    const requestId =
      params.get("m_payment_id");

    const payfastPaymentId =
      params.get("pf_payment_id");

    if (paymentStatus !== "COMPLETE") {
      return new NextResponse(
        "Ignored",
        { status: 200 }
      );
    }

    if (!requestId) {
      return new NextResponse(
        "Missing request ID",
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("document_requests")
      .update({
        payment_status: "paid",
        payment_reference: payfastPaymentId,
        paid_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      throw error;
    }

    console.log(
      "Document request payment confirmed:",
      requestId
    );

    return new NextResponse(
      "OK",
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "DOCUMENT REQUEST ITN ERROR:",
      error?.message || error
    );

    return new NextResponse(
      "Error",
      { status: 500 }
    );
  }
}