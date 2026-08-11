import type { Firestore } from "firebase-admin/firestore";

import { parsePlanHomeResumeEmail } from "./draft-resume-contract.ts";
import {
  PLAN_HOME_RESUME_RATE_LIMIT,
  PLAN_HOME_RESUME_RATE_WINDOW_MS,
  PLAN_HOME_RESUME_TOKEN_TTL_MS,
  createPlanHomeResumeToken,
  hashPlanHomeResumeValue,
  hashesMatch,
  isPlanHomeResumeToken,
} from "../../lib/plan-your-home/draft-resume-token.ts";
import {
  createRandomPlanHomeDraftSessionSecret,
  hashPlanHomeDraftSessionSecret,
} from "../../lib/plan-your-home/draft-session-token.ts";

const inquiriesCollection = "inquirySubmissions";
const tokensCollection = "planHomeResumeTokens";
const rateLimitsCollection = "planHomeResumeRateLimits";
const requesterRateLimit = 10;

export class PlanHomeResumeUnavailableError extends Error {
  constructor() {
    super("The resume request is unavailable.");
    this.name = "PlanHomeResumeUnavailableError";
  }
}

export type PlanHomeResumeDelivery = Readonly<{
  to: string;
  resumeUrl: string;
  expiresAt: Date;
}>;

function toMillis(value: unknown) {
  if (value instanceof Date) return value.getTime();
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }
  return Number.NaN;
}

function readRateLimit(value: unknown, now: Date) {
  if (!value || typeof value !== "object") {
    return { count: 0, windowStartedAt: now };
  }
  const candidate = value as Record<string, unknown>;
  const startedAt = toMillis(candidate.windowStartedAt);
  const count = candidate.count;
  if (
    !Number.isFinite(startedAt) ||
    now.getTime() - startedAt >= PLAN_HOME_RESUME_RATE_WINDOW_MS ||
    typeof count !== "number" ||
    !Number.isInteger(count) ||
    count < 0
  ) {
    return { count: 0, windowStartedAt: now };
  }
  return { count, windowStartedAt: new Date(startedAt) };
}

function readActiveToken(value: unknown) {
  if (!value || typeof value !== "object") {
    throw new PlanHomeResumeUnavailableError();
  }
  const token = value as Record<string, unknown>;
  if (
    token.status !== "active" ||
    typeof token.draftId !== "string" ||
    !/^draft-[a-f0-9]{40}$/.test(token.draftId) ||
    typeof token.tokenHash !== "string" ||
    !/^[a-f0-9]{64}$/.test(token.tokenHash)
  ) {
    throw new PlanHomeResumeUnavailableError();
  }
  return {
    draftId: token.draftId,
    tokenHash: token.tokenHash,
    expiresAt: toMillis(token.expiresAt),
  };
}

function readResumableDraft(value: unknown, now: Date) {
  if (!value || typeof value !== "object") {
    throw new PlanHomeResumeUnavailableError();
  }
  const draft = value as Record<string, unknown>;
  if (
    draft.schemaVersion !== 2 ||
    draft.experience !== "plan-your-home" ||
    draft.status !== "draft" ||
    !draft.contact ||
    typeof draft.contact !== "object" ||
    !("email" in draft.contact) ||
    typeof draft.contact.email !== "string" ||
    toMillis(draft.expiresAt) <= now.getTime()
  ) {
    throw new PlanHomeResumeUnavailableError();
  }
  return draft as Record<string, unknown> & {
    contact: { email: string };
    resumeAccess?: {
      activeTokenHash?: string | null;
      generation?: number;
    };
  };
}

export function createPlanHomeDraftResumeRepository(
  database: Firestore,
  dependencies: Readonly<{
    secret: string;
    now?: () => Date;
    createToken?: () => string;
    createSessionSecret?: () => string;
  }>,
) {
  const now = dependencies.now ?? (() => new Date());
  const createToken = dependencies.createToken ?? createPlanHomeResumeToken;
  const createSessionSecret =
    dependencies.createSessionSecret ?? createRandomPlanHomeDraftSessionSecret;

  async function consumeRateLimit(email: string, requesterIdentity: string) {
    const checkedAt = now();
    const emailHash = hashPlanHomeResumeValue(
      "email",
      email,
      dependencies.secret,
    );
    const requesterHash = hashPlanHomeResumeValue(
      "requester",
      requesterIdentity,
      dependencies.secret,
    );
    const subjectReference = database
      .collection(rateLimitsCollection)
      .doc(`email-${emailHash}`);
    const requesterReference = database
      .collection(rateLimitsCollection)
      .doc(`requester-${requesterHash}`);

    return database.runTransaction(async (transaction) => {
      const [subjectSnapshot, requesterSnapshot] = await Promise.all([
        transaction.get(subjectReference),
        transaction.get(requesterReference),
      ]);
      const subject = readRateLimit(subjectSnapshot.data(), checkedAt);
      const requester = readRateLimit(requesterSnapshot.data(), checkedAt);
      const allowed =
        subject.count < PLAN_HOME_RESUME_RATE_LIMIT &&
        requester.count < requesterRateLimit;

      transaction.set(subjectReference, {
        keyHash: emailHash,
        kind: "email",
        count: subject.count + 1,
        windowStartedAt: subject.windowStartedAt,
        updatedAt: checkedAt,
      });
      transaction.set(requesterReference, {
        keyHash: requesterHash,
        kind: "requester",
        count: requester.count + 1,
        windowStartedAt: requester.windowStartedAt,
        updatedAt: checkedAt,
      });
      return allowed;
    });
  }

  return {
    async requestResumeLink(params: {
      email: unknown;
      requesterIdentity: string;
      publicOrigin: string;
    }): Promise<PlanHomeResumeDelivery | null> {
      const parsedEmail = parsePlanHomeResumeEmail(params.email);
      if (!parsedEmail.success) return null;
      const email = parsedEmail.data;
      if (!(await consumeRateLimit(email, params.requesterIdentity))) {
        return null;
      }

      const candidates = await database
        .collection(inquiriesCollection)
        .where("contact.email", "==", email)
        .get();
      const checkedAt = now();
      const resumable = candidates.docs
        .map((snapshot) => ({ id: snapshot.id, value: snapshot.data() }))
        .filter(({ value }) => {
          try {
            readResumableDraft(value, checkedAt);
            return true;
          } catch {
            return false;
          }
        })
        .sort(
          (left, right) =>
            toMillis(right.value.updatedAt) - toMillis(left.value.updatedAt),
        )[0];
      if (!resumable) return null;

      const rawToken = createToken();
      if (!isPlanHomeResumeToken(rawToken)) {
        throw new PlanHomeResumeUnavailableError();
      }
      const tokenHash = hashPlanHomeResumeValue(
        "token",
        rawToken,
        dependencies.secret,
      );
      const tokenReference = database.collection(tokensCollection).doc(tokenHash);
      const draftReference = database
        .collection(inquiriesCollection)
        .doc(resumable.id);
      const expiresAt = new Date(
        checkedAt.getTime() + PLAN_HOME_RESUME_TOKEN_TTL_MS,
      );

      await database.runTransaction(async (transaction) => {
        const draftSnapshot = await transaction.get(draftReference);
        if (!draftSnapshot.exists) throw new PlanHomeResumeUnavailableError();
        const draft = readResumableDraft(draftSnapshot.data(), checkedAt);
        if (draft.contact.email !== email) {
          throw new PlanHomeResumeUnavailableError();
        }
        const previousHash = draft.resumeAccess?.activeTokenHash;
        const generation = (draft.resumeAccess?.generation ?? 0) + 1;

        if (previousHash && /^[a-f0-9]{64}$/.test(previousHash)) {
          transaction.set(
            database.collection(tokensCollection).doc(previousHash),
            { status: "rotated", rotatedAt: checkedAt },
            { merge: true },
          );
        }
        transaction.create(tokenReference, {
          tokenHash,
          draftId: resumable.id,
          status: "active",
          issuedAt: checkedAt,
          expiresAt,
          consumedAt: null,
          generation,
        });
        transaction.update(draftReference, {
          resumeAccess: {
            activeTokenHash: tokenHash,
            issuedAt: checkedAt,
            expiresAt,
            consumedAt: null,
            generation,
          },
        });
      });

      const resumeUrl = new URL(
        "/plan-your-home/resume/consume",
        params.publicOrigin,
      );
      resumeUrl.searchParams.set("token", rawToken);
      return { to: email, resumeUrl: resumeUrl.toString(), expiresAt };
    },

    async consumeResumeToken(rawToken: unknown) {
      if (!isPlanHomeResumeToken(rawToken)) {
        throw new PlanHomeResumeUnavailableError();
      }
      const tokenHash = hashPlanHomeResumeValue(
        "token",
        rawToken,
        dependencies.secret,
      );
      const tokenReference = database.collection(tokensCollection).doc(tokenHash);
      const checkedAt = now();
      const sessionSecret = createSessionSecret();
      const sessionTokenHash = hashPlanHomeDraftSessionSecret(sessionSecret);

      return database.runTransaction(async (transaction) => {
        const tokenSnapshot = await transaction.get(tokenReference);
        if (!tokenSnapshot.exists) throw new PlanHomeResumeUnavailableError();
        const token = readActiveToken(tokenSnapshot.data());
        if (
          !hashesMatch(tokenHash, token.tokenHash) ||
          !Number.isFinite(token.expiresAt) ||
          token.expiresAt <= checkedAt.getTime()
        ) {
          throw new PlanHomeResumeUnavailableError();
        }

        const draftReference = database
          .collection(inquiriesCollection)
          .doc(token.draftId);
        const draftSnapshot = await transaction.get(draftReference);
        if (!draftSnapshot.exists) throw new PlanHomeResumeUnavailableError();
        const draft = readResumableDraft(draftSnapshot.data(), checkedAt);
        if (
          typeof draft.resumeAccess?.activeTokenHash !== "string" ||
          !hashesMatch(draft.resumeAccess.activeTokenHash, tokenHash)
        ) {
          throw new PlanHomeResumeUnavailableError();
        }

        transaction.update(tokenReference, {
          status: "consumed",
          consumedAt: checkedAt,
        });
        transaction.update(draftReference, {
          draftSession: {
            tokenHash: sessionTokenHash,
            issuedAt: checkedAt,
          },
          resumeAccess: {
            activeTokenHash: null,
            issuedAt: null,
            expiresAt: null,
            consumedAt: checkedAt,
            generation: draft.resumeAccess?.generation ?? 1,
          },
        });

        return { draftId: token.draftId, sessionSecret } as const;
      });
    },
  };
}

export type PlanHomeDraftResumeRepository = ReturnType<
  typeof createPlanHomeDraftResumeRepository
>;
