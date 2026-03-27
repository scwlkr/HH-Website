import { getSupabaseAdminClient } from "@/lib/db/client";
import type { InquirySubmissionInput } from "@/types/inquiry";

export async function insertInquirySubmission(input: InquirySubmissionInput) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("inquiry_submissions")
    .insert({
      name: input.name,
      phone: input.phone,
      email: input.email,
      preferred_contact_method: input.preferredContactMethod,
      project_type: input.projectType,
      finish_level: input.finishLevel,
      services_needed: input.servicesNeeded,
      approx_square_footage: input.approxSquareFootage,
      project_location: input.projectLocation,
      lot_status: input.lotStatus,
      timeline: input.timeline,
      budget_range: input.budgetRange,
      project_description: input.projectDescription,
      source_page: input.sourcePage,
      utm_source: input.utmSource,
      utm_medium: input.utmMedium,
      utm_campaign: input.utmCampaign,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to persist inquiry submission: ${error.message}`);
  }

  return data;
}
