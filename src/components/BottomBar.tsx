import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactModal } from "./ContactModal";

export const BottomBar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <aside className="fixed bottom-0 left-0 right-0 bg-primary/95 backdrop-blur-md border-t border-border z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between gap-4">
          <div className="hidden md:flex flex-col">
            <span className="font-serif text-2xl font-bold text-primary-foreground">$4,500<span className="text-base font-normal">/mo</span></span>
            <span className="text-sm text-primary-foreground/80">4 bed · 3.5 bath · 3,500 sq ft</span>
          </div>
          <Button
            size="lg"
            className="flex-1 md:flex-none bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            onClick={() => setIsModalOpen(true)}
          >
            Express Interest
          </Button>
        </div>
      </aside>
      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
