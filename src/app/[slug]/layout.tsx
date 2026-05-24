import DashboardSidebar from "@/app/[slug]/_components/DashboardSidebar";
import DashboardTopBar from "@/app/[slug]/_components/DashboardTopbar";
import { StudioSlugSync } from "@/app/[slug]/_components/StudioSlugSync";
import { BrandCanvas } from "@/components/brand/BrandCanvas";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <SidebarProvider>
        <StudioSlugSync />
        <DashboardSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col h-screen ">
            <DashboardTopBar />
            <BrandCanvas className="min-h-full">
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </BrandCanvas>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
