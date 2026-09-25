import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type IdentificationType = "SA_ID" | "PASSPORT";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const identificationType = String(
      body?.identificationType || ""
    )
      .trim()
      .toUpperCase() as IdentificationType;

    const saIdNumber = String(
      body?.saIdNumber || ""
    ).trim();

    const passportNumber = String(
      body?.passportNumber || ""
    ).trim();

    const passportCountry = String(
      body?.passportCountry || ""
    ).trim();

    const uploadSessionId = String(
      body?.uploadSessionId || ""
    ).trim();

    const idDocumentPath = String(
      body?.idDocumentPath || ""
    ).trim();

    const dnrDocumentPath = String(
      body?.dnrDocumentPath || ""
    ).trim();

    /*
     * Validate the participant identity.
     *
     * A registration must use exactly one
     * supported identification method:
     *
     * SA_ID:
     * - South African ID number
     *
     * PASSPORT:
     * - Passport number
     * - Country of issue
     */
    if (
      identificationType !== "SA_ID" &&
      identificationType !== "PASSPORT"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid identification type is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      identificationType === "SA_ID" &&
      !saIdNumber
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "South African ID number is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      identificationType === "PASSPORT" &&
      (
        !passportNumber ||
        !passportCountry
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Passport number and country of issue are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!uploadSessionId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Upload session could not be identified.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !idDocumentPath ||
      !dnrDocumentPath
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Uploaded document information is incomplete.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();

    /*
     * 1. Confirm the upload session exists,
     *    is still active, and owns exactly
     *    these two document paths.
     */
    const {
      data: uploadSession,
      error: uploadSessionError,
    } = await supabase
      .from(
        "registration_upload_sessions"
      )
      .select(
        `
          id,
          id_document_path,
          dnr_document_path,
          registration_id,
          cleanup_status
        `
      )
      .eq(
        "id",
        uploadSessionId
      )
      .maybeSingle();

    if (uploadSessionError) {
      throw uploadSessionError;
    }

    if (!uploadSession) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Upload session could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      uploadSession.cleanup_status !==
      "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This upload session is no longer available for registration.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      uploadSession.registration_id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This upload session has already been linked to a registration.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      uploadSession.id_document_path !==
        idDocumentPath ||
      uploadSession.dnr_document_path !==
        dnrDocumentPath
    ) {
      console.error(
        "REGISTER: upload session document paths do not match:",
        uploadSessionId
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Uploaded document information could not be verified.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * 2. Create the DNR registration.
     *
     * Only the identity fields belonging
     * to the selected identification type
     * are stored.
     */
    const {
      data: registration,
      error: registrationError,
    } = await supabase
      .from("dnr_registrations")
      .insert([
        {
          full_name:
            body.fullName,

          identification_type:
            identificationType,

          sa_id_number:
            identificationType === "SA_ID"
              ? saIdNumber
              : null,

          passport_number:
            identificationType === "PASSPORT"
              ? passportNumber
              : null,

          passport_country:
            identificationType === "PASSPORT"
              ? passportCountry
              : null,

          date_of_birth:
            body.dateOfBirth,

          email:
            body.email,

          mobile_number:
            body.mobileNumber,

          next_of_kin_name:
            body.nextOfKinName,

          next_of_kin_phone:
            body.nextOfKinPhone,

          id_document_path:
            idDocumentPath,

          dnr_document_path:
            dnrDocumentPath,

          upload_session_id:
            uploadSessionId,
        },
      ])
      .select(
        "id"
      )
      .single();

    if (
      registrationError ||
      !registration
    ) {
      throw (
        registrationError ||
        new Error(
          "Registration could not be created."
        )
      );
    }

    /*
     * 3. Claim the upload session.
     *
     * Once this succeeds, the session is
     * permanently protected from orphan cleanup.
     */
    const completedAt =
      new Date().toISOString();

    const {
      data: completedSession,
      error: sessionUpdateError,
    } = await supabase
      .from(
        "registration_upload_sessions"
      )
      .update({
        registration_id:
          registration.id,

        completed_at:
          completedAt,

        cleanup_status:
          "completed",
      })
      .eq(
        "id",
        uploadSessionId
      )
      .eq(
        "cleanup_status",
        "active"
      )
      .is(
        "registration_id",
        null
      )
      .select(
        "id"
      )
      .maybeSingle();

    if (
      sessionUpdateError ||
      !completedSession
    ) {
      console.error(
        "REGISTER: failed to claim upload session:",
        uploadSessionId
      );

      /*
       * Roll back the registration row.
       *
       * The uploaded files and active upload
       * session remain intact, so the operation
       * can safely be retried rather than leaving
       * inconsistent ownership data.
       */
      const {
        error: rollbackError,
      } = await supabase
        .from("dnr_registrations")
        .delete()
        .eq(
          "id",
          registration.id
        );

      if (rollbackError) {
        console.error(
          "REGISTER ROLLBACK ERROR:",
          rollbackError.message
        );
      }

      throw (
        sessionUpdateError ||
        new Error(
          "Upload session could not be linked to the registration."
        )
      );
    }

    console.log(
      "REGISTRATION CREATED AND UPLOAD SESSION COMPLETED:",
      uploadSessionId
    );

    return NextResponse.json({
      success: true,
      registrationId:
        registration.id,
    });

  } catch (error: any) {
    console.error(
      "REGISTER ERROR:",
      error?.message || error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to create registration.",
      },
      {
        status: 500,
      }
    );
  }
}