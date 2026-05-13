import MarketingNavbar from "@/components/layout/Marketing-Navbar";

const MarketingLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingNavbar />
      {children}
    </div>
  );
};

export default MarketingLayout;
