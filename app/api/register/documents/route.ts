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

/*
 * Validate the actual file contents rather than
 * trusting only the filename or browser MIME type.
 */
async function validateFile(
  file: File
): Promise<ValidatedFile> {
  if (file.size <= 0) {
    throw new Error(
      "One of the uploaded files is empty."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "Each uploaded file must be smaller than 10 MB."
    );
  }

  const arrayBuffer =
    await file.arrayBuffer();

  const buffer =
    Buffer.from(arrayBuffer);

  /*
   * PDF signature:
   * %PDF-
   */
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

  /*
   * JPEG signature:
   * FF D8 FF
   */
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

  /*
   * PNG signature:
   * 89 50 4E 47 0D 0A 1A 0A
   */
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
  let idDocumentPath:
    | string
    | null = null;

  let dnrDocumentPath:
    | string
    | null = null;

  const uploadSessionId =
    crypto.randomUUID();

  try {
    /*
     * The browser sends both documents
     * as multipart/form-data.
     */
    const formData =
      await req.formData();

    const idDocument =
      formData.get("idDocument");

    const dnrDocument =
      formData.get("dnrDocument");

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

    if (!(dnrDocument instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Signed DNR document is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validate both files server-side.
     */
    const validatedId =
      await validateFile(
        idDocument
      );

    const validatedDnr =
      await validateFile(
        dnrDocument
      );

    const supabase =
      getSupabaseAdmin();

    /*
     * Use opaque random filenames.
     */
    idDocumentPath =
      `${crypto.randomUUID()}.${validatedId.extension}`;

    dnrDocumentPath =
      `${crypto.randomUUID()}.${validatedDnr.extension}`;

    /*
     * Upload identification document.
     */
    const {
      error: idUploadError,
    } = await supabase.storage
      .from("id-documents")
      .upload(
        idDocumentPath,
        validatedId.buffer,
        {
          contentType:
            validatedId.contentType,

          cacheControl: "0",

          upsert: false,
        }
      );

    if (idUploadError) {
      throw new Error(
        `Identification document upload failed: ${idUploadError.message}`
      );
    }

    /*
     * Upload signed DNR document.
     */
    const {
      error: dnrUploadError,
    } = await supabase.storage
      .from("dnr-documents")
      .upload(
        dnrDocumentPath,
        validatedDnr.buffer,
        {
          contentType:
            validatedDnr.contentType,

          cacheControl: "0",

          upsert: false,
        }
      );

    if (dnrUploadError) {
      await supabase.storage
        .from("id-documents")
        .remove([
          idDocumentPath,
        ]);

      idDocumentPath = null;

      throw new Error(
        `DNR document upload failed: ${dnrUploadError.message}`
      );
    }

    /*
     * Create the upload-session tracking row.
     *
     * At this stage the session is active
     * and not yet linked to a registration.
     */
    const {
      error: sessionError,
    } = await supabase
      .from(
        "registration_upload_sessions"
      )
      .insert([
        {
          id:
            uploadSessionId,

          id_document_path:
            idDocumentPath,

          dnr_document_path:
            dnrDocumentPath,

          registration_id:
            null,

          completed_at:
            null,

          cleanup_status:
            "active",
        },
      ]);

    if (sessionError) {
      /*
       * If we cannot track the files,
       * delete them immediately.
       */
      await supabase.storage
        .from("id-documents")
        .remove([
          idDocumentPath,
        ]);

      await supabase.storage
        .from("dnr-documents")
        .remove([
          dnrDocumentPath,
        ]);

      idDocumentPath = null;
      dnrDocumentPath = null;

      throw new Error(
        `Upload session could not be created: ${sessionError.message}`
      );
    }

    console.log(
      "REGISTRATION DOCUMENTS: uploaded and tracked securely",
      uploadSessionId
    );

    return NextResponse.json({
      success: true,

      uploadSessionId,

      idDocumentPath,

      dnrDocumentPath,
    });

  } catch (error: any) {
    console.error(
      "REGISTRATION DOCUMENT UPLOAD ERROR:",
      error?.message || error
    );

    /*
     * Best-effort cleanup for any files
     * still remaining after an unexpected error.
     */
    try {
      const supabase =
        getSupabaseAdmin();

      if (idDocumentPath) {
        await supabase.storage
          .from("id-documents")
          .remove([
            idDocumentPath,
          ]);
      }

      if (dnrDocumentPath) {
        await supabase.storage
          .from("dnr-documents")
          .remove([
            dnrDocumentPath,
          ]);
      }

    } catch (cleanupError) {
      console.error(
        "REGISTRATION DOCUMENT CLEANUP ERROR:",
        cleanupError
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to securely upload registration documents.",
      },
      {
        status: 500,
      }
    );
  }
}