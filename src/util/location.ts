// Trả về number (mét)
export const getDistanceValue = (
    coord1: [number, number] | number[] | string,
    coord2: [number, number] | number[] | string
  ): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
  
    const parseCoord = (
      coord: [number, number] | number[] | string
    ): [number, number] => {
      let lat: number, lon: number;
  
      if (typeof coord === "string") {
        const [a, b] = coord.split(",").map((x) => parseFloat(x.trim()));
        lat = a;
        lon = b;
      } else if (Array.isArray(coord)) {
        lat = coord[0];
        lon = coord[1];
      } else {
        lat = coord[0];
        lon = coord[1];
      }
  
      if (Math.abs(lat) > 90 && Math.abs(lon) <= 90) return [lon, lat];
  
      return [lat, lon];
    };
  
    const [lat1, lon1] = parseCoord(coord1);
    const [lat2, lon2] = parseCoord(coord2);
  
    const R = 6371e3;
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);
  
    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return R * c; // trả về số (mét)
  };
  
  // Format hiển thị như cũ
  export const formatDistance = (distance: number) =>
    distance < 1000 ? `${distance.toFixed(1)} m` : `${(distance / 1000).toFixed(2)} km`;
  