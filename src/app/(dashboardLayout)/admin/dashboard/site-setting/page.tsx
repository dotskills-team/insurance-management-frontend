import type { Metadata } from "next";
import SiteSettingManagement from "@/components/siteSetting/SiteSettingManagement";

export const metadata: Metadata = {
  title: "Site Setting | Shurokkha",
  description: "Control staff access to the system",
};

export default function SiteSettingPage() {
  return <SiteSettingManagement />;
}
