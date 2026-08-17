import type { Route } from "next";
import { redirect } from "next/navigation";

import { getLegacyInquiryRedirectHref } from "@/lib/project-start";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LegacyInquiryRedirect({
  searchParams,
}: Readonly<{ searchParams: SearchParams }>) {
  redirect(getLegacyInquiryRedirectHref(await searchParams) as Route);
}
