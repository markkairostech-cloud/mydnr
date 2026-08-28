import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type StorageCheckResult = {
  exists: boolean;
};

function splitStoragePath(path: string) {
  const parts = path
    .split("/")
    .filter(Boolean);

  const fileName =
    parts.pop() || "";

  const folder =
    parts.join("/");

  return {
    folder,
    fileName,
  };
}

async function storageObjectExists(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  bucket: string,
  path: string
): Promise<StorageCheckResult> {
  const {
    folder,
    fileName,
  } = splitStoragePath(path);

  if (!fileName) {
    throw new Error(
      `Invalid Storage path supplied for bucket ${bucket}.`
    );
  }

  const {
    data,
    error,
  } = await supabase.storage
    .from(bucket)
    .list(
      folder || "",
      {
        limit: 100,
        search: fileName,
      }
    );

  if (error) {
    throw new Error(
      `Unable to verify Storage object in ${bucket}: ${error.message}`
    );
  }

  const exists =
    Boolean(
      data?.some(
        (item) =>
          item.name === fileName
      )
    );

  return {
    exists,
  };
}

async function ensureStorageObjectDeleted(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  bucket: string,
  path: string
) {
  const before =
    await storageObjectExists(
      supabase,
      bucket,
      path
    );

  /*
   * If the object is already absent, treat that as
   * acceptable. This makes the endpoint safely retryable
   * if a previous attempt deleted one file and then failed
   * later in the process.
   */
  if (!before.exists) {
    console.log(
      "REVOCATION: Storage object already absent",
      bucket,
      path
    );

    return;
  }

  const {
    error: deleteError,
  } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (deleteError) {
    throw new Error(
      `Unable to delete document from ${bucket}: ${deleteError.message}`
    );
  }

  /*
   * Never trust .remove() alone.
   * Confirm the object has actually disappeared.
   */
  const after =
    await storageObjectExists(
      supabase,
      bucket,
      path
    );

  if (after.exists) {
    throw new Error(
      `Storage deletion could not be verified for ${bucket}.`
    );
  }
}

function getSevenYearRetentionDate(
  completedAt: Date
) {
  const retentionUntil =
    new Date(completedAt);

  retentionUntil.setUTCFullYear(
    retentionUntil.getUTCFullYear() + 7
  );

  return retentionUntil.toISOString();
}

export async function POST(
  req: Request
) {
  try {
    const body =
      await req.json();

    const revocationRequestId =
      String(
        body?.revocationRequestId || ""
      ).trim();

    const voluntaryRevocationConfirmed =
      body?.voluntaryRevocationConfirmed ===
      true;

    const consequencesUnderstood =
      body?.consequencesUnderstood ===
      true;

    const identityDocumentAttested =
      body?.identityDocumentAttested ===
      true;

    if (!revocationRequestId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Revocation request could not be identified.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !voluntaryRevocationConfirmed ||
      !consequencesUnderstood ||
      !identityDocumentAttested
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "All revocation confirmations are required.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();

    /*
     * 1. Load the revocation request.
     */
    const {
      data: revocationRequest,
      error: requestError,
    } = await supabase
      .from("revocation_requests")
      .select(
        `
          id,
          registration_id,
          sa_id_number,
          verification_document_path,
          identity_evidence_supplied,
          identity_verification_status,
          revocation_status,
          voluntary_revocation_confirmed,
          consequences_understood,
          identity_document_attested,
          confirmed_at,
          completed_at
        `
      )
      .eq(
        "id",
        revocationRequestId
      )
      .maybeSingle();

    if (requestError) {
      throw requestError;
    }

    if (!revocationRequest) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Revocation request could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * If the request has already completed,
     * return success rather than attempting
     * the destructive operation again.
     */
    if (
      revocationRequest.revocation_status ===
      "completed"
    ) {
      return NextResponse.json({
        success: true,
        completed: true,
      });
    }

    if (
      revocationRequest.revocation_status !==
        "identity_evidence_uploaded" &&
      revocationRequest.revocation_status !==
        "confirmed"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This revocation request is not available for confirmation.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      !revocationRequest.identity_evidence_supplied ||
      !revocationRequest.verification_document_path
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Identity evidence has not been supplied for this revocation request.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * 2. Load the linked DNR registration.
     */
    const {
      data: registration,
      error: registrationError,
    } = await supabase
      .from("dnr_registrations")
      .select(
        `
          id,
          sa_id_number,
          payment_status,
          registration_status,
          id_document_path,
          dnr_document_path,
          upload_session_id
        `
      )
      .eq(
        "id",
        revocationRequest.registration_id
      )
      .maybeSingle();

    if (registrationError) {
      throw registrationError;
    }

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The linked DNR registration could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      registration.sa_id_number !==
      revocationRequest.sa_id_number
    ) {
      console.error(
        "REVOCATION: SA ID mismatch between request and registration",
        revocationRequestId
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "The revocation request could not be verified against the registration.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      registration.payment_status !==
      "paid"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The linked DNR registration is not eligible for revocation.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * A retry may encounter a registration that was
     * already changed to revoked by a previous attempt.
     */
    if (
      registration.registration_status !==
        "active" &&
      registration.registration_status !==
        "revoked"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This DNR registration is not currently eligible for revocation.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      !registration.id_document_path ||
      !registration.dnr_document_path
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The stored registration document information is incomplete.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * 3. Record the participant's explicit declarations
     *    before any destructive action begins.
     */
    if (
      revocationRequest.revocation_status ===
      "identity_evidence_uploaded"
    ) {
      const confirmedAt =
        new Date().toISOString();

      const {
        data: confirmedRequest,
        error: confirmationError,
      } = await supabase
        .from("revocation_requests")
        .update({
          voluntary_revocation_confirmed:
            true,

          consequences_understood:
            true,

          identity_document_attested:
            true,

          confirmed_at:
            confirmedAt,

          revocation_status:
            "confirmed",
        })
        .eq(
          "id",
          revocationRequestId
        )
        .eq(
          "revocation_status",
          "identity_evidence_uploaded"
        )
        .select("id")
        .maybeSingle();

      if (
        confirmationError ||
        !confirmedRequest
      ) {
        throw (
          confirmationError ||
          new Error(
            "Revocation confirmation could not be recorded."
          )
        );
      }
    }

    /*
     * 4. Ensure an audit record exists before
     *    destructive document deletion begins.
     *
     * If a later operation fails, this record
     * gives us evidence that the process started.
     */
    const {
      data: existingAudit,
      error: existingAuditError,
    } = await supabase
      .from("audit_logs")
      .select("id")
      .eq(
        "revocation_request_id",
        revocationRequestId
      )
      .limit(1)
      .maybeSingle();

    if (existingAuditError) {
      throw existingAuditError;
    }

    let auditId =
      existingAudit?.id || null;

    if (!auditId) {
      const {
        data: auditRecord,
        error: auditInsertError,
      } = await supabase
        .from("audit_logs")
        .insert([
          {
            event_type:
              "dnr_revocation_started",

            sa_id_number:
              revocationRequest.sa_id_number,

            registration_id:
              registration.id,

            revocation_request_id:
              revocationRequestId,

            identity_evidence_supplied:
              true,

            identity_verification_status:
              revocationRequest.identity_verification_status,

            previous_status:
              "active",

            new_status:
              null,

            documents_deleted:
              false,

            retention_until:
              null,

            details:
              "Participant confirmed voluntary DNR revocation. Destructive revocation processing started.",
          },
        ])
        .select("id")
        .single();

      if (
        auditInsertError ||
        !auditRecord
      ) {
        throw (
          auditInsertError ||
          new Error(
            "Revocation audit record could not be created."
          )
        );
      }

      auditId =
        auditRecord.id;
    }

    /*
     * 5. On the first attempt, verify all three
     *    documents exist before deleting anything.
     *
     * On a retry, one or more objects may already
     *    be absent because a previous attempt got
     *    partway through the process.
     */
    if (
      revocationRequest.revocation_status ===
      "identity_evidence_uploaded"
    ) {
      const [
        originalIdCheck,
        originalDnrCheck,
        verificationCheck,
      ] = await Promise.all([
        storageObjectExists(
          supabase,
          "id-documents",
          registration.id_document_path
        ),

        storageObjectExists(
          supabase,
          "dnr-documents",
          registration.dnr_document_path
        ),

        storageObjectExists(
          supabase,
          "revocation-verification-documents",
          revocationRequest.verification_document_path
        ),
      ]);

      if (
        !originalIdCheck.exists ||
        !originalDnrCheck.exists ||
        !verificationCheck.exists
      ) {
        throw new Error(
          "One or more documents required for the revocation process could not be verified in secure storage."
        );
      }
    }

    /*
     * 6. Delete and independently verify the
     *    original registration ID document.
     */
    await ensureStorageObjectDeleted(
      supabase,
      "id-documents",
      registration.id_document_path
    );

    /*
     * 7. Delete and independently verify the
     *    registered DNR document.
     */
    await ensureStorageObjectDeleted(
      supabase,
      "dnr-documents",
      registration.dnr_document_path
    );

    /*
     * 8. Delete and independently verify the
     *    temporary revocation identity evidence.
     */
    await ensureStorageObjectDeleted(
      supabase,
      "revocation-verification-documents",
      revocationRequest.verification_document_path
    );

    /*
     * 9. Final verification that all three
     *    objects are absent.
     */
    const [
      finalOriginalIdCheck,
      finalOriginalDnrCheck,
      finalVerificationCheck,
    ] = await Promise.all([
      storageObjectExists(
        supabase,
        "id-documents",
        registration.id_document_path
      ),

      storageObjectExists(
        supabase,
        "dnr-documents",
        registration.dnr_document_path
      ),

      storageObjectExists(
        supabase,
        "revocation-verification-documents",
        revocationRequest.verification_document_path
      ),
    ]);

    if (
      finalOriginalIdCheck.exists ||
      finalOriginalDnrCheck.exists ||
      finalVerificationCheck.exists
    ) {
      throw new Error(
        "Secure document deletion could not be fully verified."
      );
    }

    /*
     * 10. Change the DNR registration lifecycle
     *     state to revoked.
     *
     * The conditional allows a retry where a
     * previous attempt already changed the status.
     */
    if (
      registration.registration_status ===
      "active"
    ) {
      const {
        data: revokedRegistration,
        error: registrationUpdateError,
      } = await supabase
        .from("dnr_registrations")
        .update({
          registration_status:
            "revoked",
        })
        .eq(
          "id",
          registration.id
        )
        .eq(
          "registration_status",
          "active"
        )
        .select("id")
        .maybeSingle();

      if (
        registrationUpdateError ||
        !revokedRegistration
      ) {
        throw (
          registrationUpdateError ||
          new Error(
            "The DNR registration could not be marked as revoked."
          )
        );
      }
    }

    /*
     * 11. Complete the revocation request.
     */
    const completedAt =
      new Date();

    const completedAtIso =
      completedAt.toISOString();

    const retentionUntil =
      getSevenYearRetentionDate(
        completedAt
      );

    const {
      data: completedRequest,
      error: requestCompleteError,
    } = await supabase
      .from("revocation_requests")
      .update({
        voluntary_revocation_confirmed:
          true,

        consequences_understood:
          true,

        identity_document_attested:
          true,

        revocation_status:
          "completed",

        completed_at:
          completedAtIso,
      })
      .eq(
        "id",
        revocationRequestId
      )
      .eq(
        "revocation_status",
        "confirmed"
      )
      .select("id")
      .maybeSingle();

    if (
      requestCompleteError ||
      !completedRequest
    ) {
      /*
       * Before treating this as a failure,
       * re-read the row. A retry or previous
       * attempt may already have completed it.
       */
      const {
        data: recheckedRequest,
        error: recheckError,
      } = await supabase
        .from("revocation_requests")
        .select(
          "id, revocation_status"
        )
        .eq(
          "id",
          revocationRequestId
        )
        .maybeSingle();

      if (
        recheckError ||
        !recheckedRequest ||
        recheckedRequest.revocation_status !==
          "completed"
      ) {
        throw (
          requestCompleteError ||
          recheckError ||
          new Error(
            "The revocation request could not be completed."
          )
        );
      }
    }

    /*
     * 12. Finalise the seven-year audit record.
     */
    const {
      error: auditUpdateError,
    } = await supabase
      .from("audit_logs")
      .update({
        event_type:
          "dnr_revocation_completed",

        identity_evidence_supplied:
          true,

        identity_verification_status:
          revocationRequest.identity_verification_status,

        previous_status:
          "active",

        new_status:
          "revoked",

        documents_deleted:
          true,

        retention_until:
          retentionUntil,

        details:
          "Participant completed voluntary DNR revocation. Original registration identification document, registered DNR document and temporary revocation identity evidence were securely deleted and deletion was verified.",
      })
      .eq(
        "id",
        auditId
      );

    if (auditUpdateError) {
      throw new Error(
        `Revocation completed but the audit record could not be finalised: ${auditUpdateError.message}`
      );
    }

    console.log(
      "DNR REVOCATION COMPLETED:",
      revocationRequestId
    );

    return NextResponse.json({
      success: true,
      completed: true,
    });

  } catch (error: any) {
    console.error(
      "DNR REVOCATION CONFIRM ERROR:",
      error?.message || error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to complete the DNR revocation.",
      },
      {
        status: 500,
      }
    );
  }
}