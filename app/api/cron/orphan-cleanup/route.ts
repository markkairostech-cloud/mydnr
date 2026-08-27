import { NextResponse } from "next/server";
import {
  executeOrphanCleanup,
} from "@/lib/orphan-cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * Weekly Vercel Cron endpoint.
 *
 * Vercel will call this route automatically
 * according to the schedule in vercel.json.
 *
 * CRON_SECRET is separate from the
 * ORPHAN_CLEANUP_SECRET used by the
 * administrative endpoint.
 */
export async function GET(req: Request) {
  const cronSecret =
    process.env.CRON_SECRET;

  /*
   * Fail closed if the secret has not
   * been configured.
   */
  if (!cronSecret) {
    console.error(
      "CRON ORPHAN CLEANUP: CRON_SECRET is not configured"
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Cron authentication is not configured.",
      },
      {
        status: 500,
      }
    );
  }

  /*
   * Vercel Cron supplies the secret in
   * the Authorization header:
   *
   * Authorization: Bearer <CRON_SECRET>
   */
  const authorization =
    req.headers.get(
      "authorization"
    );

  if (
    authorization !==
    `Bearer ${cronSecret}`
  ) {
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
    console.log(
      "CRON ORPHAN CLEANUP: weekly run started"
    );

    /*
     * Use exactly the same cleanup engine
     * as the secured admin endpoint.
     */
    const result =
      await executeOrphanCleanup();

    console.log(
      "CRON ORPHAN CLEANUP: weekly run completed",
      {
        candidates:
          result.candidateCount,

        deleted:
          result.deletedCount,

        skipped:
          result.skippedCount,

        failed:
          result.failedCount,
      }
    );

    return NextResponse.json(
      result
    );

  } catch (error: any) {
    console.error(
      "CRON ORPHAN CLEANUP ERROR:",
      error?.message || error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Weekly orphan cleanup failed.",
      },
      {
        status: 500,
      }
    );
  }
}