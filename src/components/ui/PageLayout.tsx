import { ReactNode } from "react";
import { FreezeStatusBanner } from "@/components/FreezeStatusBanner";

interface PageLayoutProps {
  children: ReactNode;
  showFreezeBanner?: boolean;
}

export const PageLayout = ({ children, showFreezeBanner = true }: PageLayoutProps) => {
  return (
    <>
      {showFreezeBanner && <FreezeStatusBanner />}
      {children}
    </>
  );
};
