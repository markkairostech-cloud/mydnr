import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const ORPHAN_GRACE_PERIOD_HOURS = 24;

/*
 * Require a private bearer token before allowing
 * access to the orphan cleanup administration API.
 *
 * The secret exists only in server-side environment
 * variables and is never exposed to the browser.
 */
function isAuthorized(req: Request) {
  const configuredSecret =
    process.env.ORPHAN_CLEANUP_SECRET;

  if (!configuredSecret) {
    console.error(
      "ORPHAN CLEANUP: ORPHAN_CLEANUP_SECRET is not configured"
    );

    return false;
  }

  const authorization =
    req.headers.get("authorization");

  if (!authorization) {
    return false;
  }

  const expectedAuthorization =
    `Bearer ${configuredSecret}`;

  return authorization === expectedAuthorization;
}

function getCutoffDate() {
  return new Date(
    Date.now() -
      ORPHAN_GRACE_PERIOD_HOURS *
        60 *
        60 *
        1000
  ).toISOString();
}

/*
 * Split a Storage path into:
 *
 * folder: optional folder path
 * filename: exact object filename
 *
 * Examples:
 *
 * abc.pdf
 * =>
 * folder = ""
 * filename = "abc.pdf"
 *
 * uploads/abc.pdf
 * =>
 * folder = "uploads"
 * filename = "abc.pdf"
 */
function splitStoragePath(path: string) {
  const parts = path.split("/");

  const filename =
    parts.pop() || "";

  const folder =
    parts.join("/");

  return {
    folder,
    filename,
  };
}

/*
 * Verify whether an exact object still exists
 * in a Supabase Storage bucket.
 *
 * We do not trust remove() returning without an
 * error as proof that the object was deleted.
 */
async function storageObjectExists(
  bucket: string,
  path: string
) {
  const supabase =
    getSupabaseAdmin();

  const {
    folder,
    filename,
  } = splitStoragePath(path);

  if (!filename) {
    throw new Error(
      "Invalid Storage object path."
    );
  }

  const {
    data,
    error,
  } = await supabase.storage
    .from(bucket)
    .list(
      folder,
      {
        limit: 100,
        search: filename,
      }
    );

  if (error) {
    throw new Error(
      `Unable to verify Storage object: ${error.message}`
    );
  }

  return (
    data?.some(
      (item) =>
        item.name === filename
    ) ?? false
  );
}

/*
 * GET
 *
 * SAFE DRY RUN ONLY.
 *
 * Finds orphan candidates but never deletes
 * anything.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }
  try {
    const supabase =
      getSupabaseAdmin();

    const cutoffDate =
      getCutoffDate();

    const {
      data: orphanCandidates,
      error,
    } = await supabase
      .from(
        "registration_upload_sessions"
      )
      .select(
        `
          id,
          created_at,
          id_document_path,
          dnr_document_path,
          registration_id,
          cleanup_status,
          cleaned_up_at
        `
      )
      .eq(
        "cleanup_status",
        "active"
      )
      .is(
        "registration_id",
        null
      )
      .lt(
        "created_at",
        cutoffDate
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    const candidates =
      orphanCandidates || [];

    console.log(
      "ORPHAN CLEANUP DRY RUN:",
      candidates.length,
      "candidate(s) found"
    );

    return NextResponse.json({
      success: true,

      mode:
        "dry-run",

      gracePeriodHours:
        ORPHAN_GRACE_PERIOD_HOURS,

      cutoffDate,

      candidateCount:
        candidates.length,

      candidates:
        candidates.map(
          (candidate) => ({
            uploadSessionId:
              candidate.id,

            createdAt:
              candidate.created_at,

            idDocumentPath:
              candidate.id_document_path,

            dnrDocumentPath:
              candidate.dnr_document_path,

            cleanupStatus:
              candidate.cleanup_status,
          })
        ),
    });

  } catch (error: any) {
    console.error(
      "ORPHAN CLEANUP DRY RUN ERROR:",
      error?.message || error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to evaluate orphaned document candidates.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * POST
 *
 * EXECUTES ORPHAN CLEANUP.
 *
 * Every candidate is revalidated before
 * deletion.
 *
 * A session is only marked "deleted" after
 * both Storage objects have independently
 * been confirmed absent.
 */
export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }
  try {
    const supabase =
      getSupabaseAdmin();

    const cutoffDate =
      getCutoffDate();

    /*
     * Find potential orphan candidates.
     */
    const {
      data: candidates,
      error: candidateError,
    } = await supabase
      .from(
        "registration_upload_sessions"
      )
      .select(
        `
          id,
          created_at,
          id_document_path,
          dnr_document_path,
          registration_id,
          cleanup_status
        `
      )
      .eq(
        "cleanup_status",
        "active"
      )
      .is(
        "registration_id",
        null
      )
      .lt(
        "created_at",
        cutoffDate
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

    if (candidateError) {
      throw candidateError;
    }

    const results: Array<{
      uploadSessionId: string;
      status:
        | "deleted"
        | "skipped"
        | "failed";
      reason?: string;
    }> = [];

    for (
      const candidate of
        candidates || []
    ) {
      /*
       * Re-read immediately before deletion.
       */
      const {
        data: currentSession,
        error: recheckError,
      } = await supabase
        .from(
          "registration_upload_sessions"
        )
        .select(
          `
            id,
            created_at,
            id_document_path,
            dnr_document_path,
            registration_id,
            cleanup_status
          `
        )
        .eq(
          "id",
          candidate.id
        )
        .maybeSingle();

      if (
        recheckError ||
        !currentSession
      ) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "failed",

          reason:
            "Upload session could not be re-validated.",
        });

        continue;
      }

      /*
       * Safety check 1:
       * still active.
       */
      if (
        currentSession.cleanup_status !==
        "active"
      ) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "skipped",

          reason:
            "Upload session is no longer active.",
        });

        continue;
      }

      /*
       * Safety check 2:
       * still has no registration.
       */
      if (
        currentSession.registration_id
      ) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "skipped",

          reason:
            "Upload session is now linked to a registration.",
        });

        continue;
      }

      /*
       * Safety check 3:
       * still outside the grace period.
       */
      const sessionCreatedAt =
        new Date(
          currentSession.created_at
        ).getTime();

      const cutoffTime =
        new Date(
          cutoffDate
        ).getTime();

      if (
        !Number.isFinite(
          sessionCreatedAt
        ) ||
        sessionCreatedAt >=
          cutoffTime
      ) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "skipped",

          reason:
            "Upload session is still within the grace period.",
        });

        continue;
      }

      /*
       * Safety check 4:
       *
       * Independently confirm that no
       * dnr_registrations row references
       * this upload session.
       */
      const {
        data:
          linkedRegistration,
        error:
          registrationCheckError,
      } = await supabase
        .from(
          "dnr_registrations"
        )
        .select(
          "id"
        )
        .eq(
          "upload_session_id",
          currentSession.id
        )
        .limit(1)
        .maybeSingle();

      if (
        registrationCheckError
      ) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "failed",

          reason:
            "Registration ownership could not be verified.",
        });

        continue;
      }

      if (
        linkedRegistration
      ) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "skipped",

          reason:
            "A registration references this upload session.",
        });

        continue;
      }

      /*
       * Confirm the ID document actually
       * exists before attempting deletion.
       */
      let idExistsBefore:
        boolean;

      try {
        idExistsBefore =
          await storageObjectExists(
            "id-documents",
            currentSession.id_document_path
          );
      } catch (error: any) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "failed",

          reason:
            error?.message ||
            "ID document existence could not be verified.",
        });

        continue;
      }

      /*
       * Confirm the DNR document actually
       * exists before attempting deletion.
       */
      let dnrExistsBefore:
        boolean;

      try {
        dnrExistsBefore =
          await storageObjectExists(
            "dnr-documents",
            currentSession.dnr_document_path
          );
      } catch (error: any) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "failed",

          reason:
            error?.message ||
            "DNR document existence could not be verified.",
        });

        continue;
      }

      /*
       * If either file is already missing,
       * do not pretend cleanup succeeded.
       *
       * Leave the session active so the
       * inconsistency can be investigated.
       */
      if (!idExistsBefore) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "failed",

          reason:
            "Tracked ID document does not exist in Storage.",
        });

        continue;
      }

      if (!dnrExistsBefore) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "failed",

          reason:
            "Tracked DNR document does not exist in Storage.",
        });

        continue;
      }

      /*
       * Delete the ID document.
       */
      const {
        error:
          idDeleteError,
      } = await supabase.storage
        .from(
          "id-documents"
        )
        .remove([
          currentSession.id_document_path,
        ]);

      if (idDeleteError) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "failed",

          reason:
            `ID document deletion failed: ${idDeleteError.message}`,
        });

        continue;
      }

      /*
       * Independently verify that the ID
       * document is now absent.
       */
      let idExistsAfter:
        boolean;

      try {
        idExistsAfter =
          await storageObjectExists(
            "id-documents",
            currentSession.id_document_path
          );
      } catch (error: any) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "failed",

          reason:
            error?.message ||
            "ID document deletion could not be verified.",
        });

        continue;
      }

      if (idExistsAfter) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "failed",

          reason:
            "ID document still exists after deletion attempt.",
        });

        continue;
      }

      /*
       * Delete the DNR document.
       */
      const {
        error:
          dnrDeleteError,
      } = await supabase.storage
        .from(
          "dnr-documents"
        )
        .remove([
          currentSession.dnr_document_path,
        ]);

      if (dnrDeleteError) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "failed",

          reason:
            `DNR document deletion failed: ${dnrDeleteError.message}`,
        });

        continue;
      }

      /*
       * Independently verify that the DNR
       * document is now absent.
       */
      let dnrExistsAfter:
        boolean;

      try {
        dnrExistsAfter =
          await storageObjectExists(
            "dnr-documents",
            currentSession.dnr_document_path
          );
      } catch (error: any) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "failed",

          reason:
            error?.message ||
            "DNR document deletion could not be verified.",
        });

        continue;
      }

      if (dnrExistsAfter) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "failed",

          reason:
            "DNR document still exists after deletion attempt.",
        });

        continue;
      }

      /*
       * FINAL VERIFICATION
       *
       * Both objects must now be absent
       * before we update the database.
       */
      let finalIdExists:
        boolean;

      let finalDnrExists:
        boolean;

      try {
        [
          finalIdExists,
          finalDnrExists,
        ] = await Promise.all([
          storageObjectExists(
            "id-documents",
            currentSession.id_document_path
          ),

          storageObjectExists(
            "dnr-documents",
            currentSession.dnr_document_path
          ),
        ]);
      } catch (error: any) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "failed",

          reason:
            error?.message ||
            "Final Storage deletion verification failed.",
        });

        continue;
      }

      if (
        finalIdExists ||
        finalDnrExists
      ) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "failed",

          reason:
            "One or more Storage objects still exist after cleanup.",
        });

        continue;
      }

      /*
       * Both files have now been verified
       * absent.
       *
       * Only now do we mark the session
       * as deleted.
       */
      const cleanedUpAt =
        new Date().toISOString();

      const {
        data:
          updatedSession,
        error:
          updateError,
      } = await supabase
        .from(
          "registration_upload_sessions"
        )
        .update({
          cleanup_status:
            "deleted",

          cleaned_up_at:
            cleanedUpAt,
        })
        .eq(
          "id",
          currentSession.id
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
        updateError ||
        !updatedSession
      ) {
        results.push({
          uploadSessionId:
            candidate.id,

          status:
            "failed",

          reason:
            "Documents were deleted, but cleanup status could not be recorded.",
        });

        continue;
      }

      console.log(
        "ORPHAN CLEANUP: deletion verified and session marked deleted:",
        currentSession.id
      );

      results.push({
        uploadSessionId:
          candidate.id,

        status:
          "deleted",
      });
    }

    const deletedCount =
      results.filter(
        (result) =>
          result.status ===
          "deleted"
      ).length;

    const skippedCount =
      results.filter(
        (result) =>
          result.status ===
          "skipped"
      ).length;

    const failedCount =
      results.filter(
        (result) =>
          result.status ===
          "failed"
      ).length;

    return NextResponse.json({
      success:
        failedCount === 0,

      mode:
        "execute",

      gracePeriodHours:
        ORPHAN_GRACE_PERIOD_HOURS,

      cutoffDate,

      candidateCount:
        candidates?.length || 0,

      deletedCount,

      skippedCount,

      failedCount,

      results,
    });

  } catch (error: any) {
    console.error(
      "ORPHAN CLEANUP ERROR:",
      error?.message || error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to complete orphaned document cleanup.",
      },
      {
        status: 500,
      }
    );
  }
}