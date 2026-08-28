import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type ValidatedFile = {
  buffer: Buffer;
  extension: "pdf" | "jpg" | "png";
  contentType:
    | "application/pdf"
    | "image/jpeg"
    | "image/png";
};

async function validateFile(
  file: File
): Promise<ValidatedFile> {
  if (file.size <= 0) {
    throw new Error(
      "The uploaded identification document is empty."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "The uploaded identification document must be smaller than 10 MB."
    );
  }

  const arrayBuffer =
    await file.arrayBuffer();

  const buffer =
    Buffer.from(arrayBuffer);

  const isPdf =
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d;

  if (isPdf) {
    return {
      buffer,
      extension: "pdf",
      contentType:
        "application/pdf",
    };
  }

  const isJpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  if (isJpeg) {
    return {
      buffer,
      extension: "jpg",
      contentType:
        "image/jpeg",
    };
  }

  const pngSignature = [
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
  ];

  const isPng =
    buffer.length >=
      pngSignature.length &&
    pngSignature.every(
      (byte, index) =>
        buffer[index] === byte
    );

  if (isPng) {
    return {
      buffer,
      extension: "png",
      contentType:
        "image/png",
    };
  }

  throw new Error(
    "Only genuine PDF, JPG, JPEG or PNG files are permitted."
  );
}

export async function POST(req: Request) {
  let verificationDocumentPath:
    | string
    | null = null;

  try {
    const formData =
      await req.formData();

    const saIdNumber = String(
      formData.get("saIdNumber") || ""
    ).trim();

    const idDocument =
      formData.get("idDocument");

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

    if (!(idDocument instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Identification document is required.",
        },
        {
          status: 400,
        }
      );
    }

    const validatedId =
      await validateFile(
        idDocument
      );

    const supabase =
      getSupabaseAdmin();

    /*
     * Reconfirm that an active paid
     * registration still exists.
     */
    const {
      data: registrations,
      error: registrationError,
    } = await supabase
      .from("dnr_registrations")
      .select("id")
      .eq("sa_id_number", saIdNumber)
      .eq("payment_status", "paid")
      .eq("registration_status", "active")
      .limit(1);

    if (registrationError) {
      throw registrationError;
    }

    if (
      !registrations ||
      registrations.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No active DNR registration was found.",
        },
        {
          status: 404,
        }
      );
    }

    const registrationId =
      registrations[0].id;

    verificationDocumentPath =
      `${crypto.randomUUID()}.${validatedId.extension}`;

    /*
     * Upload the temporary identity
     * evidence to the dedicated
     * private revocation bucket.
     */
    const {
      error: uploadError,
    } = await supabase.storage
      .from(
        "revocation-verification-documents"
      )
      .upload(
        verificationDocumentPath,
        validatedId.buffer,
        {
          contentType:
            validatedId.contentType,

          cacheControl: "0",

          upsert: false,
        }
      );

    if (uploadError) {
      throw new Error(
        `Identification document upload failed: ${uploadError.message}`
      );
    }

    /*
     * Create the revocation request.
     */
    const {
      data: revocationRequest,
      error: requestError,
    } = await supabase
      .from("revocation_requests")
      .insert([
        {
          registration_id:
            registrationId,

          sa_id_number:
            saIdNumber,

          verification_document_path:
            verificationDocumentPath,

          identity_evidence_supplied:
            true,

          identity_verification_status:
            "self_attested_mvp",

          revocation_status:
            "identity_evidence_uploaded",

          evidence_uploaded_at:
            new Date().toISOString(),
        },
      ])
      .select("id")
      .single();

    if (requestError) {
      await supabase.storage
        .from(
          "revocation-verification-documents"
        )
        .remove([
          verificationDocumentPath,
        ]);

      verificationDocumentPath = null;

      throw new Error(
        `Revocation request could not be created: ${requestError.message}`
      );
    }

    console.log(
      "REVOCATION ID EVIDENCE: uploaded and tracked securely",
      revocationRequest.id
    );

    return NextResponse.json({
      success: true,
      revocationRequestId:
        revocationRequest.id,
    });

  } catch (error: any) {
    console.error(
      "REVOCATION ID UPLOAD ERROR:",
      error?.message || error
    );

    /*
     * Best-effort cleanup if an
     * unexpected error occurs.
     */
    try {
      if (verificationDocumentPath) {
        const supabase =
          getSupabaseAdmin();

        await supabase.storage
          .from(
            "revocation-verification-documents"
          )
          .remove([
            verificationDocumentPath,
          ]);
      }
    } catch (cleanupError) {
      console.error(
        "REVOCATION ID CLEANUP ERROR:",
        cleanupError
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to securely upload identification evidence.",
      },
      {
        status: 500,
      }
    );
  }
}