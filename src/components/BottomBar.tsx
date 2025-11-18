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

  return (
    <>
      <aside className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="hidden md:flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-semibold text-slate-900">{formattedAmount}</div>
              <span className="text-xs text-slate-500">for</span>
              <Select value={selectedPeriodId} onValueChange={(value: RentPeriodId) => setSelectedPeriodId(value)}>
                <SelectTrigger className="h-8 w-auto min-w-[13rem] rounded-full border-slate-300 px-3 text-xs font-medium text-slate-700">
                  <SelectValue placeholder="Select period" />
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
            <div className="text-sm text-slate-500">
              {PROPERTY_CONFIG.bedrooms} bed · {PROPERTY_CONFIG.bathrooms} bath · {PROPERTY_CONFIG.squareFeet.toLocaleString()} sq ft
            </div>
          </div>
          <Button
            size="lg"
            className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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
