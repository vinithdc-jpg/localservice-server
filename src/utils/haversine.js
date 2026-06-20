const EARTH_RADIUS_KM = 6371;

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function filterByRadius(products, userLat, userLng, radiusKm) {
  return products
    .map((product) => {
      const distance = haversineDistance(
        userLat,
        userLng,
        product.location.lat,
        product.location.lng
      );
      return { ...product, distance: Math.round(distance * 10) / 10 };
    })
    .filter((p) => p.distance <= radiusKm);
}
