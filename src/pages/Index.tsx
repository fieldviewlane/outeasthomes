import { Suspense, lazy } from "react";
import { HorizontalCarousel } from "@/components/HorizontalCarousel";

// Both components are named exports; map them to default for React.lazy
const PropertyDetails = lazy(() =>
  import("@/components/PropertyDetails").then((module) => ({ default: module.PropertyDetails }))
);
const BottomBar = lazy(() =>
  import("@/components/BottomBar").then((module) => ({ default: module.BottomBar }))
);

const Index = () => {
  return (
    <div className="min-h-screen">
      <HorizontalCarousel />

      <Suspense fallback={null}>
        <PropertyDetails />
      </Suspense>

      <Suspense fallback={null}>
        <BottomBar />
      </Suspense>
    </div>
  );
};

export default Index;
