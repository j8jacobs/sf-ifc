const esrijsonFormat = new ol.format.EsriJSON();
const geojsonFormat = new ol.format.GeoJSON();

const FEE_LIST = [
  // "Balboa Park Community Infrastructure Impact Fee",
  // "Eastern Neighborhoods Infrastructure Impact Fee",
  // "Central SoMa Community Services Facilities Fee - Tier B",
  "Eastern Neighborhoods Infrastructure Impact Fee - Tier 1 if residential, 2 if non-residential",
];

/**
 * @return turf GeoJSON feature
 */
async function geocodeLocation(addr) {
  const locationArcgis = await fetch(
    `http://sfplanninggis.org/cpc_geocode/?search=${encodeURIComponent(addr)}`
  ).then((d) => d.json());

  // Convert ArcGIS geometry format to GeoJSON format
  const geometry = {
    type: "Polygon",
    coordinates: locationArcgis.features?.[0]?.geometry?.rings || [],
  };

  // Create a turf feature with the converted geometry
  return turf.feature(geometry, locationArcgis.features?.[0]?.attributes || {});
}

/**
 * note - this API needs to be converted, wheres the other does not
 *     geom.transform("EPSG:102100", "EPSG:4326");
 * Verify the regions with https://geojson.io/
 * @returns turf GeoJSON feature
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

  // Convert to a proper GeoJSON FeatureCollection using turf
  const features = res.features.map((f) => {
    // Read the feature using EsriJSON format
    const olFeature = esrijsonFormat.readFeature(f);

    // Get the geometry and transform it
    const geom = olFeature.getGeometry();
    geom.transform("EPSG:102100", "EPSG:4326");

    // Create a proper turf feature
    return turf.feature(
      JSON.parse(geojsonFormat.writeGeometry(geom)),
      f.attributes || {}
    );
  });

  const featureCollection = turf.featureCollection(features);
  console.log("Converted FeatureCollection:", featureCollection);
  return featureCollection;
}

$(document).ready(async function () {
  // example
  // const addr = "555 Bryant St";
  const addr = "3776094"; // balboa? i forget where this one is
  const fee = FEE_LIST[0];

  const location = await geocodeLocation(addr);
  const feeGeo = await getFeeGeo(fee);

  // verify proper coordinates by copy/pasting these into https://geojson.io/
  // console.log(location);
  // console.log(feeGeo);

  // Check intersections with all fee geometries
  const intersections = feeGeo.features.filter((feeFeature) => {
    try {
      return turf.booleanIntersects(location, feeFeature);
    } catch (e) {
      console.error("Intersection check failed:", e);
      return false;
    }
  });

  console.log("Intersecting fee areas:", intersections);
});
