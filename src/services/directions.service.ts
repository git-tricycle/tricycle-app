import { Location } from "@/src/components/ui/MapView";

export type DirectionsProfile = "driving" | "cycling" | "walking";

interface OSRMGeometry {
  coordinates: [number, number][];
  type: string;
}

interface OSRMRoute {
  geometry: OSRMGeometry;
  distance: number;
  duration: number;
}

interface OSRMResponse {
  routes?: OSRMRoute[];
  code?: string;
  message?: string;
}

const OSRM_BASE_URL = "https://router.project-osrm.org";

function buildRouteUrl(
  start: Location,
  end: Location,
  profile: DirectionsProfile = "driving"
): string {
  const coordinates = `${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;
  return `${OSRM_BASE_URL}/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson`;
}

export async function getRouteBetween(
  start: Location,
  end: Location,
  profile: DirectionsProfile = "driving"
): Promise<Location[]> {
  try {
    const response = await fetch(buildRouteUrl(start, end, profile));

    if (!response.ok) {
      throw new Error(`Directions request failed with status ${response.status}`);
    }

    const data = (await response.json()) as OSRMResponse;

    const coordinates = data.routes?.[0]?.geometry?.coordinates;
    if (!coordinates || coordinates.length === 0) {
      return [];
    }

    return coordinates.map(([longitude, latitude]) => ({
      latitude,
      longitude,
    }));
  } catch (error) {
    console.error("Failed to fetch route directions:", error);
    return [];
  }
}
