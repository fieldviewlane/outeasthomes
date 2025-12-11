import { Home, MapPin, Bed, Bath, Maximize, Clock1, LandPlot } from "lucide-react";
import { PROPERTY_CONFIG } from "@/config/property";

const amenities = [
  "Gourmet Kitchen with Premium Appliances",
  "Beautifully Landscaped, Private Yard Backing to Peaceful Farm",
  "First-Floor Primary Suite",
  "Heated Pool and Upper-Level Balcony Deck",
  "Two-Car Garage with Tesla Charger",
  "Gym with Peloton Bike",
  "Hardwood Floors",
  "Full Lower Guest Level with Kitchenette and 85” TV",
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
      <article className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12 md:py-20">
        <header className="mb-8 md:mb-12 animate-fade-in">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4 md:mb-6">
            {PROPERTY_CONFIG.headline}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base md:text-lg mb-6 md:mb-8">
            <MapPin className="h-5 w-5" />
            <address className="not-italic">{PROPERTY_CONFIG.address}</address>
          </div>
        </header>

        <section
          className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 mb-12 sm:mb-14 md:mb-16 pb-8 sm:pb-10 md:pb-12 border-b border-border"
          aria-label="Property highlights"
        >
          <div className="flex flex-col items-center p-6 bg-secondary rounded-lg">
            <Bed className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-foreground mb-2 sm:mb-3" aria-hidden="true" />
            <div className="text-xl sm:text-2xl font-semibold text-slate-900">{PROPERTY_CONFIG.bedrooms}</div>
            <div className="text-xs sm:text-sm text-slate-500 mt-1">bedrooms</div>
          </div>

          <div className="flex flex-col items-center p-4 sm:p-5 md:p-6 bg-secondary rounded-lg">
            <Bath className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-foreground mb-2 sm:mb-3" aria-hidden="true" />
            <div className="text-xl sm:text-2xl font-semibold text-slate-900">{PROPERTY_CONFIG.bathrooms}</div>
            <div className="text-xs sm:text-sm text-slate-500 mt-1">bathrooms</div>
          </div>

          <div className="flex flex-col items-center p-4 sm:p-5 md:p-6 bg-secondary rounded-lg">
            <Home className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-foreground mb-2 sm:mb-3" aria-hidden="true" />
            <div className="text-xl sm:text-2xl font-semibold text-slate-900">{PROPERTY_CONFIG.squareFeet.toLocaleString()}</div>
            <div className="text-xs sm:text-sm text-slate-500 mt-1">sq ft</div>
          </div>

          <div className="flex flex-col items-center p-4 sm:p-5 md:p-6 bg-secondary rounded-lg">
            <LandPlot className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-foreground mb-2 sm:mb-3" aria-hidden="true" />
            <div className="text-xl sm:text-2xl font-semibold text-slate-900">
              {PROPERTY_CONFIG.acreage}
            </div>
            <div className="text-xs sm:text-sm text-slate-500 mt-1">acre</div>
          </div>

          <div className="flex flex-col items-center p-4 sm:p-5 md:p-6 bg-secondary rounded-lg">
            <Clock1 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-foreground mb-2 sm:mb-3" aria-hidden="true" />
            <div className="text-xl sm:text-2xl font-semibold text-slate-900">
              {PROPERTY_CONFIG.min2town}
            </div>
            <div className="text-xs sm:text-sm text-slate-500 mt-1">minutes to town</div>
          </div>
        </section>

        <section className="mb-12 sm:mb-16 md:mb-20">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-6 md:mb-8">Premium Amenities</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {amenities.map((amenity, index) => (
               <div key={index} className="flex items-center gap-3 group">
                 <Home className="h-5 w-5 text-accent flex-shrink-0 transition-transform" aria-hidden="true" />
                 <span className="text-base sm:text-lg text-foreground">{amenity}</span>
               </div>
             ))}
          </div>
        </section>

        <section className="mb-12 sm:mb-16 md:mb-20">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-6">About Finca Hamptones</h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4 sm:mb-6">
            Welcome to a bright and inviting Hamptons summer home that blends updated living with relaxed beach vibes. Set on a beautifully landscaped acre that backs onto a quiet farm, the property offers rare privacy while remaining just 3 minutes from the heart of East Hampton Village.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4 sm:mb-6">
            The main level features an open, airy layout ideal for summer living. A renovated gourmet kitchen with premium appliances anchors the space, complemented by a first-floor primary suite designed for ease and convenience. Upstairs, additional guest bedrooms provide plenty of room for the entire family. The lower level serves as its own welcoming guest area, complete with a kitchenette, bedrooms, full bath, and a media den—ideal for visitors or a nanny.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4 sm:mb-6">
            Outdoors, the expansive backyard is a true highlight: lush plantings, a generous lawn, and a heated, gated pool create a peaceful retreat for long summer days. The adjacent deck offers electronic awnings, a BBQ, outdoor dining and lounge areas, and an outdoor shower—perfect for effortless indoor–outdoor living.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4 sm:mb-6">
            A two-car garage with Tesla charger, home gym with Peloton, hardwood floors, and a whole-house generator add practical luxury to this exceptional seasonal escape.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            A fresh, private, and perfectly located Hamptons home—crafted for effortless summer enjoyment.
          </p>
        </section>

        <section className="mb-12 sm:mb-16 md:mb-20">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-6">Direct Rental Rates</h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8">
            Rent directly from the owner and enjoy premium amenities at exclusive rates. 
          </p>
          <div className="w-full md:w-2/3 mx-auto overflow-x-auto rounded-lg border border-border bg-card">
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
      </article>
    </main>
  );
};
