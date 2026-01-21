
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const CanonicalLink = () => {
  const location = useLocation();
  const baseUrl = "https://outeasthomes.com";
  
  // Normalize path: remove trailing slash unless it's root
  const path = location.pathname === "/" 
    ? "/" 
    : location.pathname.replace(/\/$/, "");

  const canonicalUrl = `${baseUrl}${path}`;

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
};

export default CanonicalLink;
