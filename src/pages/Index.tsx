import { useEffect } from "react";
import RabhanaLanding from "@/components/landing/RabhanaLanding";
import { WhatsAppFab } from "@/components/WhatsAppFab";

const Index = () => {
  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
  }, []);

  return (
    <>
      <RabhanaLanding />
      {/* No bottom nav on the landing page, so it can sit lower. */}
      <WhatsAppFab className="bottom-6" />
    </>
  );
};

export default Index;
