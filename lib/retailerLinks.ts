/**
 * Returns the best URL to send the user to for a product.
 * The generate route now stores real product page URLs (or Google Shopping
 * fallback) in product.url — so we just return it directly when set.
 */
export function getBestProductUrl(
  productUrl: string | undefined,
  retailer: string,
  productName: string
): string {
  if (productUrl && productUrl.startsWith("http")) return productUrl;
  return getRetailerSearchUrl(retailer, productName);
}

/**
 * Generates a retailer search URL for a product name.
 * Used as a fallback when no direct product URL is available.
 */
export function getRetailerSearchUrl(retailer: string, productName: string): string {
  const q = encodeURIComponent(productName);

  const urls: Record<string, string> = {
    Zara:              `https://www.zara.com/us/en/search?searchTerm=${q}`,
    Uniqlo:            `https://www.uniqlo.com/us/en/spu/search?q=${q}`,
    Nike:              `https://www.nike.com/w?q=${q}&vst=${q}`,
    Abercrombie:       `https://www.abercrombie.com/shop/us/p/search?q=${q}`,
    "H&M":             `https://www2.hm.com/en_us/search-results.html?q=${q}`,
    "Banana Republic": `https://bananarepublic.gap.com/browse/search.do?searchText=${q}`,
    ASOS:              `https://www.asos.com/us/search/?q=${q}`,
    "Levi's":          `https://www.levi.com/US/en_US/search?q=${q}`,
    "Free People":     `https://www.freepeople.com/search?q=${q}`,
    Nordstrom:         `https://www.nordstrom.com/sr?origin=keywordsearch&keyword=${q}`,
    Anthropologie:     `https://www.anthropologie.com/search?q=${q}`,
    Mango:             `https://shop.mango.com/us/search?q=${q}`,
  };

  return (
    urls[retailer] ??
    `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(retailer + " " + productName)}`
  );
}
