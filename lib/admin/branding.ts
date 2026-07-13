export const adminBrand = {
  name: "HHQ",
  descriptor: "Staff access",
} as const;

export function formatAdminPageTitle(title: string) {
  return `${adminBrand.name} ${title}`;
}
