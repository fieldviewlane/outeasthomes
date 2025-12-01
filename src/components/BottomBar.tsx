import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactModal } from "./ContactModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROPERTY_CONFIG, type RentPeriodId } from "@/config/property";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);

export const BottomBar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<RentPeriodId>(PROPERTY_CONFIG.defaultPeriodId);

  const { selectedPeriod, formattedAmount } = useMemo(() => {
    const periods = PROPERTY_CONFIG.rentPeriods;
    const defaultPeriod = periods[0];
    const current = periods.find((p) => p.id === selectedPeriodId) ?? defaultPeriod;

    const formatted = formatCurrency(current.amount);

    return {
      selectedPeriod: current,
      formattedAmount: formatted,
    };
  }, [selectedPeriodId]);

  // Compute fixed widths so layout doesn't shift when selection changes
  const { amountWidth, periodLabelWidth } = useMemo(() => {
    const periods = PROPERTY_CONFIG.rentPeriods;

    const maxAmountLength = Math.max(
      ...periods.map((p) => formatCurrency(p.amount).length)
    );
    const maxLabelLength = Math.max(...periods.map((p) => p.label.length));

    return {
      // Slightly tighter than the raw character count so it hugs the longest text
      amountWidth: `${maxAmountLength - 1}ch`,
      periodLabelWidth: `${maxLabelLength}ch`,
    };
  }, []);

  return (
    <>
      <aside className="fixed bottom-0 left-0 right-0 bg-primary/95 backdrop-blur-md border-t border-border z-50">
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-12 flex items-center justify-center md:justify-between gap-2 sm:gap-4 md:gap-6 h-14 sm:h-16 md:h-20">
          <div className="hidden md:flex items-center gap-3">
            <span
              className="inline-block text-right font-serif text-xl sm:text-2xl md:text-3xl font-bold text-primary-foreground"
              style={{ width: amountWidth }}
            >
              {formattedAmount}
            </span>
            <span className="text-sm sm:text-base md:text-lg text-primary-foreground/90">for</span>
            <Select
              value={selectedPeriodId}
              onValueChange={(value: RentPeriodId) => setSelectedPeriodId(value)}
            >
              <SelectTrigger
                className="min-w-[140px] bg-background/20 border-primary-foreground/20 text-primary-foreground text-sm sm:text-base md:text-lg font-medium"
                style={{ width: periodLabelWidth }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_CONFIG.rentPeriods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden md:flex flex-col items-center justify-center flex-1">
            <div className="text-sm md:text-base font-medium text-primary-foreground">
              {PROPERTY_CONFIG.bedrooms} Bed 
              <span className="mx-1">|</span>
              {PROPERTY_CONFIG.bathrooms} Bath 
              <span className="mx-1">|</span>
              {PROPERTY_CONFIG.squareFeet.toLocaleString()} Sq Ft
            </div>
          </div>

          <Button
             size="lg"
            className="w-3/4 sm:w-1/2 md:w-auto md:flex-shrink-0 bg-accent hover:bg-accent/90 font-semibold text-sm sm:text-base md:text-lg px-3 sm:px-4 md:px-6 py-1 sm:py-2 md:py-2 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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
