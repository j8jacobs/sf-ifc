const FEE_LIST = [
  // "Balboa Park Community Infrastructure Impact Fee"
  // "Eastern Neighborhoods Infrastructure Impact Fee",
  "Eastern Neighborhoods Infrastructure Impact Fee - Tier 1",
  // "Eastern Neighborhoods Infrastructure Impact Fee - Tier 1 if residential, 2 if non-residential",
  // "Eastern Neighborhoods Infrastructure Impact Fee - Tier 1 if residential, 3 if non-residential",
  // "Eastern Neighborhoods Infrastructure Impact Fee - Tier 2",
  // "Eastern Neighborhoods Infrastructure Impact Fee - Tier 3",
  // "Eastern Neighborhoods Infrastructure Impact Fee - Tier 1 for 45 feet. Tier 2 for 65 feet.",
  // "Eastern Neighborhoods Infrastructure Impact Fee - Tier 1 for 65 feet. Tier 2 for 85 feet.",
  // "Eastern Neighborhoods Infrastructure Impact Fee - Tier 1 for 45 and 55 feet. Tier 2 for 65 feet."
];

/**
 * @return GeoJSON
 */
async function geocodeLocation(addr) {
  const locationArcgis = await fetch(
    `http://sfplanninggis.org/cpc_geocode/?search=${encodeURIComponent(addr)}`
  ).then((d) => d.json());
  const locationGeo = Terraformer.arcgisToGeoJSON(
    locationArcgis.features?.[0]?.geometry
  );
  return locationGeo;
}

/**
 * @returns GeoJSON
 */
async function getFeeGeo(feeName) {
  const params = {
    where: `FEE='${feeName}'`, // note wont work for area names like C-3-0(SD)
    geometryType: "esriGeometryEnvelope",
    spatialRel: "esriSpatialRelIntersects",
    returnGeometry: true,
    returnIdsOnly: false,
    returnCountOnly: false,
    returnZ: false,
    returnM: false,
    returnDistinctValues: false,
    returnTrueCurves: false,
    outSR: 102100,
    f: "json",
  };
  const res = await fetch(
    `https://sfplanninggis.org/arcgiswa/rest/services/ImpactFees/MapServer/0/query?${new URLSearchParams(
      params
    ).toString()}`
  ).then((d) => d.json());
  console.log("--- res.features.length", res.features.length, res);

  console.log();

  // Convert to a proper GeoJSON FeatureCollection with coordinate transformation
  return {
    type: "FeatureCollection",
    features: res.features.map((f) => {
      const geoJson = Terraformer.arcgisToGeoJSON(f.geometry);

      // Transform coordinates from Web Mercator to WGS84
      if (geoJson.type === "Polygon") {
        geoJson.coordinates = geoJson.coordinates.map((ring) =>
          ring.map((coord) => [
            (coord[0] * 180) / 20037508.34,
            (Math.atan(Math.exp((coord[1] * Math.PI) / 20037508.34)) * 360) /
              Math.PI -
              90,
          ])
        );
      }

      return {
        type: "Feature",
        geometry: geoJson,
        properties: f.attributes || {},
      };
    }),
  };
}

$(document).ready(async function () {
  // example
  const addr = "555 Bryant St";
  const fee = FEE_LIST[0];

  const location = await geocodeLocation(addr);
  const feeGeo = await getFeeGeo(fee);

  // Convert the location to a Feature if it isn't already
  const locationFeature = turf.feature(location);
  console.log("Location Feature", locationFeature);

  // Check intersections and ensure both geometries are Features
  const intersections = feeGeo.features.filter((f) => {
    console.log("Fee Feature: ", f);
    try {
      return turf.booleanIntersects(locationFeature, f);
    } catch (e) {
      console.error("Intersection check failed:", e);
      return false;
    }
  });

  console.log("Location: ", locationFeature);
  console.log("feeGeo: ", feeGeo);
  console.log("intersection: ", intersections);
});
