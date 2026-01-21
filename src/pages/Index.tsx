import { Suspense, lazy, useState, useEffect, useRef } from "react";
import { HorizontalCarousel } from "@/components/HorizontalCarousel";

// Both components are named exports; map them to default for React.lazy
const PropertyDetails = lazy(() =>
  import("@/components/PropertyDetails").then((module) => ({ default: module.PropertyDetails }))
);
const BottomBar = lazy(() =>
  import("@/components/BottomBar").then((module) => ({ default: module.BottomBar }))
);

// Defers rendering children until element is near viewport
const LazySection = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // Start loading 200px before visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{isVisible ? children : null}</div>;
};

const ContactModal = lazy(() =>
  import("@/components/ContactModal").then((module) => ({ default: module.ContactModal }))
);

const Index = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const handleOpenModal = () => {
    setHasOpened(true);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      <HorizontalCarousel />

      <LazySection>
        <Suspense fallback={null}>
          <PropertyDetails onOpenModal={handleOpenModal} />
        </Suspense>
      </LazySection>

      <LazySection>
        <Suspense fallback={null}>
          <BottomBar onOpenModal={handleOpenModal} />
        </Suspense>
      </LazySection>

      {hasOpened && (
        <Suspense fallback={null}>
          <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default Index;
