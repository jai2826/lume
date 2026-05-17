import { BrandCanvas } from "@/components/brand/BrandCanvas";

const AuthLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      <BrandCanvas>{children}</BrandCanvas>
    </div>
  );
};

export default AuthLayout;
