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
  acreage: number;
  min2town: number;
  rentPeriods: RentPeriod[];
  defaultPeriodId: RentPeriodId;
  /** Obfuscated contact email, assembled at runtime so it isn't plainly visible in the code. */
  contactEmail: string;
};

const CONTACT_EMAIL_USER = "hello";
const CONTACT_EMAIL_DOMAIN = "@outeasthomes.com";

export const PROPERTY_CONFIG: PropertyConfig = {
  address: "Fieldview Lane, East Hampton Village Fringe",
  headline: "East Hampton Retreat Close to Everything",
  bedrooms: 6,
  bathrooms: 4.5,
  squareFeet: 4000,
  acreage: 1,
  min2town: 3,
  contactEmail: `${CONTACT_EMAIL_USER}@${CONTACT_EMAIL_DOMAIN}`,
  rentPeriods: [
    {
      id: "july",
      label: "July",
      description: "Full month of July",
      amount: 85000,
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
      amount: 220000,
    },
  ],
  defaultPeriodId: "august",
};
