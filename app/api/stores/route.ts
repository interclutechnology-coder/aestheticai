import { NextRequest, NextResponse } from "next/server";

interface PlacesResult {
  name: string;
  vicinity: string;
  geometry: { location: { lat: number; lng: number } };
  opening_hours?: { open_now: boolean };
  rating?: number;
  place_id: string;
}

interface GeocodeResult {
  geometry: { location: { lat: number; lng: number } };
  formatted_address: string;
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, zipCode, retailers } = await req.json();
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    let latitude = lat;
    let longitude = lng;
    let locationLabel = "";

    // If zip code provided instead of coordinates, geocode it
    if (zipCode && !lat) {
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zipCode)}&key=${apiKey}`
      );
      const geoData = await geoRes.json();
      if (geoData.results?.[0]) {
        const loc = (geoData.results[0] as GeocodeResult).geometry.location;
        latitude = loc.lat;
        longitude = loc.lng;
        locationLabel = (geoData.results[0] as GeocodeResult).formatted_address;
      } else {
        return NextResponse.json({ error: "Could not find that zip code" }, { status: 400 });
      }
    }

    if (!latitude || !longitude) {
      return NextResponse.json({ error: "Location required" }, { status: 400 });
    }

    // Search for each retailer near the location
    const storeResults = await Promise.all(
      (retailers as string[]).map(async (retailer: string) => {
        const searchRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
            `location=${latitude},${longitude}&radius=16000&type=clothing_store&keyword=${encodeURIComponent(retailer)}&key=${apiKey}`
        );
        const searchData = await searchRes.json();

        return (searchData.results as PlacesResult[] || []).slice(0, 2).map((place) => {
          // Calculate rough distance in miles
          const dLat = (place.geometry.location.lat - latitude) * (Math.PI / 180);
          const dLng = (place.geometry.location.lng - longitude) * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(latitude * (Math.PI / 180)) *
              Math.cos(place.geometry.location.lat * (Math.PI / 180)) *
              Math.sin(dLng / 2) ** 2;
          const distanceMiles = 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          return {
            name: place.name,
            address: place.vicinity,
            retailer,
            distance: `${distanceMiles.toFixed(1)} mi`,
            openNow: place.opening_hours?.open_now ?? null,
            rating: place.rating ?? null,
            placeId: place.place_id,
            mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          };
        });
      })
    );

    const allStores = storeResults.flat().sort((a, b) =>
      parseFloat(a.distance) - parseFloat(b.distance)
    );

    return NextResponse.json({ stores: allStores, locationLabel });
  } catch (err) {
    console.error("Store locator error:", err);
    return NextResponse.json({ error: "Store search failed" }, { status: 500 });
  }
}
