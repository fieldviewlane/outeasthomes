import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import pool from "@/assets/pool.jpg";
import livingRoom from "@/assets/living-room.jpg";
import kitchen from "@/assets/kitchen.jpg";
import bedroom from "@/assets/bedroom.jpg";
import backyard from "@/assets/backyard.jpg";
import exterior from "@/assets/exterior.jpg";


type ImageConfig = {
  id: string;
  src: string;
  title: string;
  description: string;
};

const images: ImageConfig[] = [
  { id: "pool", src: pool, title: "Welcome to Your Summer Home", description: "A place to relax and unwind" },
  { id: "living-room", src: livingRoom, title: "Spacious Living Room", description: "Double high ceiling fills the room with light" },
  { id: "kitchen", src: kitchen, title: "Gourmet Kitchen", description: "Premium appliances, marble countertops, and room for many cooks" },
  { id: "backyard", src: backyard, title: "Private, Expansive Backyard", description: "Landscaping that changes by the month" },
  { id: "bedroom", src: bedroom, title: "Primary Suite", description: "Walk-in closet, shower & tub bathroom, direct access to outdoor lounge area" },
  { id: "exterior", src: exterior, title: "Finca Hamptones", description: "A welcoming home 3 minutes from East Hampton Village" },
];

const getInitialIndex = () => {
  if (typeof window === "undefined") return 0;
  const hash = window.location.hash.replace("#", "");
  const index = images.findIndex((image) => image.id === hash);
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
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setIsPaused(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
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
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const index = images.findIndex((image) => image.id === hash);
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

    const image = images[currentIndex];
    if (!image) return;

    const newHash = `#${image.id}`;
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, "", newHash);
    }
  }, [currentIndex, syncHash]);

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden">
      <div
        className="flex h-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div key={index} id={image.id} className="relative min-w-full h-full">
            <img
              src={image.src}
              alt={image.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-24 left-8 md:left-16 max-w-2xl animate-fade-in">
              <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold text-primary-foreground mb-2 sm:mb-3 md:mb-4">
                {image.title}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90">
                {image.description}
              </p>
            </div>
          </div>
        ))}
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

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsPaused(true);
              setCurrentIndex(index);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? "w-8 bg-accent" : "w-2 bg-primary-foreground/50"
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
