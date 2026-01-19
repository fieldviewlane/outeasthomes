import { useState, useEffect, useRef } from "react";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import { Button } from "@/components/ui/button";

type CarouselImage = {
  id: string;
  title: string;
  description: string;
  altText?: string;
};

const carouselData: CarouselImage[] = [
  { id: "pool", title: "Welcome to Your Summer Home", description: "A place to relax and unwind", altText: "Private heated pool at Finca Hamptones East Hampton summer rental" },
  { id: "living-room", title: "Spacious Living Room", description: "Press the 'Express Interest' button below to get more information", altText: "Spacious luxury living room with classic hardwood floors and natural light" },
  { id: "kitchen", title: "Gourmet Kitchen", description: "Premium appliances, marble countertops, and room for many cooks", altText: "Professional Chef's Kitchen in East Hampton luxury rental with marble countertops" },
  { id: "backyard", title: "Private, Expansive Backyard", description: "Landscaping that changes by the month", altText: "Secluded grounds at Finca Hamptones backing to peaceful farmland vistas" },
  { id: "bedroom", title: "Primary Suite", description: "Walk-in closet, shower & tub bathroom, direct access to outdoor lounge area", altText: "Private first-floor primary bedroom with direct outdoor lounge access" },
  { id: "bath_primary", title: "Spa-Like Primary Bathroom", description: "A serene space with soaking tub and walk-in shower", altText: "Spa-like primary bathroom with soaking tub and rainfall shower" },
  { id: "gym", title: "Private Gym", description: "A fully equipped space to keep up your routine", altText: "Private home gym featuring Peloton bike in East Hampton rental" },
  { id: "bed_balcony", title: "Bedroom with Private Balcony", description: "Morning light and fresh air just outside your door", altText: "Luxury bedroom with private upper-level balcony deck overlooking the estate" },
  { id: "kitchenette_den", title: "Second living area", description: "A complete second space for family, friends, and nannies", altText: "Finished lower-level guest room with kitchenette and 85-inch cinema area" },
  { id: "bed_corner", title: "Peaceful Corner Bedroom", description: "Press the 'Express Interest' button below to get more information", altText: "Peaceful guest bedroom with classic hardwood flooring" },
  { id: "front", title: "Finca Hamptones", description: "A welcoming home 3 minutes from East Hampton Village", altText: "Finca Hamptones estate exterior located 3 minutes from East Hampton Village" },
];

const getInitialIndex = () => {
  if (typeof window === "undefined") return 0;
  const hash = window.location.hash.replace("#", "");
  const index = carouselData.findIndex((image) => image.id === hash);
  return index !== -1 ? index : 0;
};

export const HorizontalCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(getInitialIndex);
  const [isPaused, setIsPaused] = useState(false);
  // Only sync the URL hash if there was one on load or the user later changes it.
  const [syncHash, setSyncHash] = useState<boolean>(
    typeof window !== "undefined" && window.location.hash.length > 0,
  );

  const nextSlide = () => {
    setIsPaused(true);
    setCurrentIndex((prev) => (prev + 1) % carouselData.length);
  };

  const prevSlide = () => {
    setIsPaused(true);
    setCurrentIndex((prev) => (prev - 1 + carouselData.length) % carouselData.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isPaused) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselData.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [isPaused, currentIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const index = carouselData.findIndex((image) => image.id === hash);
      if (index !== -1) {
        setIsPaused(true);
        setCurrentIndex(index);
        setSyncHash(true);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // If there was no hash on initial load and the user hasn't used a hash,
    // don't modify the URL when just visiting outeasthomes.com.
    if (!syncHash) return;

    const image = carouselData[currentIndex];
    if (!image) return;

    const newHash = `#${image.id}`;
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, "", newHash);
    }
  }, [currentIndex, syncHash]);

  const [showScrollHint, setShowScrollHint] = useState(false);
  const [lastIndexReached, setLastIndexReached] = useState(false);
  const userHasScrolled = useRef(false);

  // Hide hint on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setShowScrollHint(false);
        userHasScrolled.current = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!userHasScrolled.current) {
        setShowScrollHint(true);
      }
    }, 15000); // Show after 15s

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentIndex === carouselData.length - 1) {
      setLastIndexReached(true);
    }
    if (lastIndexReached && currentIndex === 0) {
      if (!userHasScrolled.current) {
        setShowScrollHint(true);
      }
    }
  }, [currentIndex, lastIndexReached]);

  return (
    <section className="relative h-[92dvh] w-full overflow-hidden">

      <div
        className="flex h-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {carouselData.map((img, index) => {
          // Generate paths dynamically based on the ID
          const srcSmall = `/assets/${img.id}-small.avif`;
          const srcMedium = `/assets/${img.id}-medium.avif`;
          const srcLarge = `/assets/${img.id}-large.avif`;

          return (
            <div key={img.id} id={img.id} className="relative min-w-full h-full">
              <picture>
                <source media="(min-width: 1025px)" srcSet={srcLarge} />
                <source media="(min-width: 601px)" srcSet={srcMedium} />
                <img
                  src={srcSmall}
                  alt={img.altText || img.title}
                  loading={index === 0 ? "eager" : "lazy"}
                  // @ts-expect-error fetchpriority is not yet in React types
                  fetchpriority={index === 0 ? "high" : "auto"}
                  width="600"
                  height="1067"
                  className="w-full h-full object-cover"
                  decoding="async"
                />
              </picture>
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-24 left-8 right-8 md:left-16 md:right-16 max-w-2xl animate-fade-in">
                <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold text-primary-foreground mb-2 sm:mb-3 md:mb-4">
                  {img.title}
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90">
                  {img.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90 border-border/50"
        onClick={prevSlide}
        aria-label="Previous image"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90 border-border/50"
        onClick={nextSlide}
        aria-label="Next image"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Scroll Hint Overlay */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-1000 ${showScrollHint ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/20 animate-bounce">
          <p className="text-xs font-medium text-foreground whitespace-nowrap">
            Scroll down for more information
          </p>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {carouselData.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsPaused(true);
              setCurrentIndex(index);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex ? "w-8 bg-accent" : "w-2 bg-primary-foreground/50"
              }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
