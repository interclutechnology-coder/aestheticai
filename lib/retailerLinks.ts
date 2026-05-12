/**
 * Generates a real, working retailer search URL for a product.
 * These search pages are publicly accessible — no login required.
 */
export function getRetailerSearchUrl(retailer: string, productName: string): string {
  const q = encodeURIComponent(productName);

  const urls: Record<string, string> = {
    Zara:             `https://www.zara.com/us/en/search?searchTerm=${q}`,
    Uniqlo:           `https://www.uniqlo.com/us/en/spu/search?q=${q}`,
    Nike:             `https://www.nike.com/w?q=${q}&vst=${q}`,
    Abercrombie:      `https://www.abercrombie.com/shop/us/p/search?q=${q}`,
    "H&M":            `https://www2.hm.com/en_us/search-results.html?q=${q}`,
    "Banana Republic":`https://bananarepublic.gap.com/browse/search.do?searchText=${q}`,
    ASOS:             `https://www.asos.com/us/search/?q=${q}`,
    "Levi's":         `https://www.levi.com/US/en_US/search?q=${q}`,
    "Free People":    `https://www.freepeople.com/search?q=${q}`,
  };

  return (
    urls[retailer] ??
    `https://www.google.com/search?q=${encodeURIComponent(retailer + " " + productName)}`
  );
}
