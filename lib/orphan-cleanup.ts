import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const ORPHAN_GRACE_PERIOD_HOURS = 24;

export function getCutoffDate() {
  return new Date(
    Date.now() -
      ORPHAN_GRACE_PERIOD_HOURS *
        60 *
        60 *
        1000
  ).toISOString();
}

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

export async function getOrphanCandidates() {
  const supabase =
    getSupabaseAdmin();

  const cutoffDate =
    getCutoffDate();

  const {
    data,
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

  return {
    cutoffDate,
    candidates:
      data || [],
  };
}

export async function executeOrphanCleanup() {
  const supabase =
    getSupabaseAdmin();

  const {
    cutoffDate,
    candidates,
  } = await getOrphanCandidates();

  const results: Array<{
    uploadSessionId: string;
    status:
      | "deleted"
      | "skipped"
      | "failed";
    reason?: string;
  }> = [];

  for (
    const candidate of candidates
  ) {
    /*
     * Re-read the upload session immediately
     * before deletion.
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
     * session must still be active.
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
     * it must still be unlinked.
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
     * it must still be older than
     * the grace period.
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
     * Confirm independently that no
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
     * Confirm both files exist before
     * attempting deletion.
     */
    let idExistsBefore:
      boolean;

    let dnrExistsBefore:
      boolean;

    try {
      idExistsBefore =
        await storageObjectExists(
          "id-documents",
          currentSession.id_document_path
        );

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
          "Storage objects could not be verified.",
      });

      continue;
    }

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
      error: idDeleteError,
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
     * Verify ID document is gone.
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
      error: dnrDeleteError,
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
     * Verify DNR document is gone.
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
     * Final independent verification.
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
     * Only after both documents have been
     * independently verified absent do we
     * mark the upload session deleted.
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

  return {
    success:
      failedCount === 0,

    mode:
      "execute",

    gracePeriodHours:
      ORPHAN_GRACE_PERIOD_HOURS,

    cutoffDate,

    candidateCount:
      candidates.length,

    deletedCount,

    skippedCount,

    failedCount,

    results,
  };
}