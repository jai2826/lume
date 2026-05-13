import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/Topbar";
// import TopBar from "@/components/layout/TopBar"; // We will add this next

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}