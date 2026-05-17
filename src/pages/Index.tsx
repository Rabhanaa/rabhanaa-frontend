import { useEffect } from "react";
import RabhanaLanding from "@/components/landing/RabhanaLanding";

const Index = () => {
  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
  }, []);

  return <RabhanaLanding />;
};

export default Index;
