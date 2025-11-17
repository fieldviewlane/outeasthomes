import { Home, MapPin, Bed, Bath, Maximize, Calendar } from "lucide-react";

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

export const PropertyDetails = () => {
  return (
    <main className="bg-background">
      <article className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <header className="mb-12 animate-fade-in">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-6">
            Your Dream Home Awaits
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground text-lg mb-8">
            <MapPin className="h-5 w-5" />
            <address className="not-italic">123 Luxury Lane, Premium District, City</address>
          </div>
        </header>

        <section className="flex flex-wrap items-center gap-4 mb-12 pb-8 border-b border-border" aria-label="Property features">
          <div className="flex items-center gap-2">
            <Bed className="h-5 w-5 text-accent" aria-hidden="true" />
            <span className="font-semibold text-foreground">4 bed</span>
          </div>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-2">
            <Bath className="h-5 w-5 text-accent" aria-hidden="true" />
            <span className="font-semibold text-foreground">3.5 bath</span>
          </div>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-2">
            <Maximize className="h-5 w-5 text-accent" aria-hidden="true" />
            <span className="font-semibold text-foreground">3,500 sq ft</span>
          </div>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" aria-hidden="true" />
            <span className="font-semibold text-foreground">Available Now</span>
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
