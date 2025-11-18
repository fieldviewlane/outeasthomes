import { Home, MapPin, Bed, Bath, Maximize, Calendar } from "lucide-react";
import { PROPERTY_CONFIG } from "@/config/property";

const amenities = [
  "Gourmet Kitchen with Premium Appliances",
  "Smart Home Technology",
  "Private Backyard with Patio",
  "Two-Car Garage",
  "Hardwood Floors Throughout",
  "Central Air Conditioning",
  "In-Unit Washer & Dryer",
  "Walk-in Closets",
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);

export const PropertyDetails = () => {
  return (
    <main className="bg-background">
      <article className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <header className="mb-12 animate-fade-in">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-6">
            {PROPERTY_CONFIG.headline}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground text-lg mb-8">
            <MapPin className="h-5 w-5" />
            <address className="not-italic">{PROPERTY_CONFIG.address}</address>
          </div>
        </header>

        <section
          className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-16 pb-12 border-b border-border"
          aria-label="Property highlights"
        >
          <div className="flex flex-col items-center p-6 bg-secondary rounded-lg">
            <Home className="h-8 w-8 text-foreground mb-3" aria-hidden="true" />
            <div className="text-2xl font-semibold text-slate-900">
              {formatCurrency(PROPERTY_CONFIG.baseRentPerPeriod)}
            </div>
            <div className="text-sm text-slate-500 mt-1">per period</div>
          </div>

          <div className="flex flex-col items-center p-6 bg-secondary rounded-lg">
            <Bed className="h-8 w-8 text-foreground mb-3" aria-hidden="true" />
            <div className="text-2xl font-semibold text-slate-900">{PROPERTY_CONFIG.bedrooms}</div>
            <div className="text-sm text-slate-500 mt-1">bedrooms</div>
          </div>

          <div className="flex flex-col items-center p-6 bg-secondary rounded-lg">
            <Bath className="h-8 w-8 text-foreground mb-3" aria-hidden="true" />
            <div className="text-2xl font-semibold text-slate-900">{PROPERTY_CONFIG.bathrooms}</div>
            <div className="text-sm text-slate-500 mt-1">bathrooms</div>
          </div>

          <div className="flex flex-col items-center p-6 bg-secondary rounded-lg">
            <Maximize className="h-8 w-8 text-foreground mb-3" aria-hidden="true" />
            <div className="text-2xl font-semibold text-slate-900">{PROPERTY_CONFIG.squareFeet.toLocaleString()}</div>
            <div className="text-sm text-slate-500 mt-1">sq ft</div>
          </div>

          <div className="flex flex-col items-center p-6 bg-secondary rounded-lg col-span-2 md:col-span-1">
            <Calendar className="h-8 w-8 text-foreground mb-3" aria-hidden="true" />
            <div className="text-lg font-semibold text-slate-900 text-center">Available Now</div>
            <div className="text-sm text-slate-500 mt-1">availability</div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="font-serif text-4xl font-bold text-foreground mb-6">Rental Rates</h2>
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-left">
              <thead className="bg-muted/60">
                <tr className="border-b border-border">
                  <th className="py-4 px-6 text-sm font-semibold tracking-wide text-muted-foreground">
                    Period
                  </th>
                  <th className="py-4 px-6 text-right text-sm font-semibold tracking-wide text-muted-foreground">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {PROPERTY_CONFIG.rentPeriods.map((period, index) => (
                  <tr
                    key={period.id}
                    className={
                      index !== PROPERTY_CONFIG.rentPeriods.length - 1
                        ? "border-b border-border/60"
                        : undefined
                    }
                  >
                    <td className="py-4 px-6 align-top">
                      <div className="font-medium text-foreground">{period.label}</div>
                      {period.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {period.description}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right align-middle">
                      <span className="text-xl font-semibold text-foreground">
                        {formatCurrency(period.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-20">
          <h2 className="font-serif text-4xl font-bold text-foreground mb-6">About This Property</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Welcome to this stunning contemporary home that seamlessly blends modern luxury with comfortable living. 
            Designed for those who appreciate refined aesthetics and premium quality, this residence offers an 
            unparalleled lifestyle experience.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Every detail has been carefully curated to provide the ultimate in comfort and sophistication. From the 
            gourmet kitchen perfect for entertaining to the serene master suite, this home is a true sanctuary in 
            the heart of the city's most desirable neighborhood.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-4xl font-bold text-foreground mb-8">Premium Amenities</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {amenities.map((amenity, index) => (
              <div key={index} className="flex items-center gap-3 group">
                <Home className="h-5 w-5 text-accent flex-shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <span className="text-lg text-foreground">{amenity}</span>
              </div>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
};
