import type { SVGProps } from "react";

const paths = {
  dashboard: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  projects: "M3 7V5a1 1 0 0 1 1-1h5l2 3h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z",
  tasks: "M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-4M8 12l3 3 6-7",
  people: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 4a4 4 0 0 1 0 8m4 9v-2a4 4 0 0 0-3-3M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  systems: "m12 2 9 5v10l-9 5-9-5V7Zm4 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  reports: "M5 21V10m7 11V3m7 18V7",
  integrations: "m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1",
  settings: "m10 2-1 3-3 1-3 1 1 4-1 4 3 2 3 1 1 3h4l1-3 3-1 3-2-1-4 1-4-3-1-3-1-1-3Zm6 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  help: "M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  chevron: "m7 10 5 5 5-5",
  calendar: "M8 2v4m8-4v4M3 10h18M4 4h16a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm3 10h2m4 0h2m-8 3h2m4 0h2",
  check: "m8 12 3 3 5-6M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  clock: "M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  activity: "M2 12h5l3-9 4 18 3-9h5",
  bolt: "m13 2-9 12h7l-1 8 10-13h-7Z",
  inbox: "M4 3h16l2 12v6H2v-6Zm-2 12h6l2 3h4l2-3h6",
  menu: "M3 6h18M3 12h18M3 18h18",
  close: "m6 6 12 12M6 18 18 6",
  external: "M14 3h7v7m0-7L10 14M10 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6",
  logout: "M9 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h5m6-15 6 6-6 6M8 12h13",
  plus: "M12 5v14M5 12h14",
} as const;

export type HHQIconName = keyof typeof paths;

export function HHQIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: HHQIconName }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}
