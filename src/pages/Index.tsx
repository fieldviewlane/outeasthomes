import { HorizontalCarousel } from "@/components/HorizontalCarousel";
import { PropertyDetails } from "@/components/PropertyDetails";
import { BottomBar } from "@/components/BottomBar";

const Index = () => {
  return (
    <div className="min-h-screen">
      <HorizontalCarousel />
      <PropertyDetails />
      <BottomBar />
    </div>
  );
};

export default Index;
