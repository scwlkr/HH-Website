export const adminBrand = {
  name: "HHQ",
  descriptor: "Howeth & Harp internal control panel",
} as const;

export function formatAdminPageTitle(title: string) {
  return `${adminBrand.name} ${title}`;
}
