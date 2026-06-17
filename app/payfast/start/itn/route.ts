import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);

    const paymentStatus = params.get("payment_status");
    const registrationId = params.get("m_payment_id");
    const payfastPaymentId = params.get("pf_payment_id");

    if (paymentStatus !== "COMPLETE") {
      return new NextResponse("Ignored", {
        status: 200,
      });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("dnr_registrations")
      .update({
        payment_status: "paid",
        payment_reference: payfastPaymentId,
        paid_at: new Date().toISOString(),
      })
      .eq("id", registrationId);

    if (error) {
      throw error;
    }

    console.log(
      "Payment confirmed for registration:",
      registrationId
    );

    return new NextResponse("OK", {
      status: 200,
    });
  } catch (error: any) {
    console.error(
      "ITN ERROR:",
      error?.message || error
    );

    return new NextResponse("Error", {
      status: 500,
    });
  }
}