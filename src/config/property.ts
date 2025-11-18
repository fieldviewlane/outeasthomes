export type RentPeriodId = "july" | "august" | "md_to_ld";

export type RentPeriod = {
  id: RentPeriodId;
  label: string;
  description: string;
  amount: number;
};

export type PropertyConfig = {
  address: string;
  headline: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  baseRentPerPeriod: number;
  rentPeriods: RentPeriod[];
  defaultPeriodId: RentPeriodId;
};

export const PROPERTY_CONFIG: PropertyConfig = {
  address: "123 Luxury Lane, Premium District, City",
  headline: "Your Dream Home Awaits",
  bedrooms: 4,
  bathrooms: 3.5,
  squareFeet: 3500,
  baseRentPerPeriod: 4500,
  rentPeriods: [
    {
      id: "july",
      label: "July",
      description: "Full month of July",
      amount: 90000,
    },
    {
      id: "august",
      label: "August",
      description: "Full month of August",
      amount: 95000,
    },
    {
      id: "md_to_ld",
      label: "Memorial Day-Labor Day",
      description: "Seasonal stay",
      amount: 250000,
    },
  ],
  defaultPeriodId: "august",
};
