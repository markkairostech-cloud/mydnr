import { NextResponse } from "next/server";
import {
  executeOrphanCleanup,
  getOrphanCandidates,
  ORPHAN_GRACE_PERIOD_HOURS,
} from "@/lib/orphan-cleanup";

export const runtime = "nodejs";

/*
 * Require a private bearer token before allowing
 * access to the orphan cleanup administration API.
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

  return (
    authorization ===
    `Bearer ${configuredSecret}`
  );
}

/*
 * GET = authenticated dry-run only.
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
    const {
      cutoffDate,
      candidates,
    } = await getOrphanCandidates();

    return NextResponse.json({
      success: true,
      mode: "dry-run",

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
 * POST = authenticated cleanup execution.
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
    const result =
      await executeOrphanCleanup();

    return NextResponse.json(
      result
    );

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