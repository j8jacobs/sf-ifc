const esrijsonFormat = new ol.format.EsriJSON();
const geojsonFormat = new ol.format.GeoJSON();

// https://sfplanninggis.org/arcgiswa/rest/services/ImpactFees/MapServer/0/query
// these official fee names can be queried here to return bounding locations for intersection
// todo - where can we get a list of these fee names? particularily the obscure ones
const FEE_LIST = [
  "Balboa Park Community Infrastructure Impact Fee",
  "Central SoMa Fees - Tier A",
  "Central SoMa Fees - Tier B",
  "Central SoMa Fees - Tier C",
  "Eastern Neighborhoods Infrastructure Impact Fee - Tier 1 for 45 and 55 feet. Tier 2 for 65 feet.",
  "Eastern Neighborhoods Infrastructure Impact Fee - Tier 1 for 45 feet. Tier 2 for 65 feet.",
  "Eastern Neighborhoods Infrastructure Impact Fee - Tier 3",
  "Eastern Neighborhoods Infrastructure Impact Fee - Tier 1 if residential, 2 if non-residential",
  "Eastern Neighborhoods Infrastructure Impact Fee - Tier 2",
  "Eastern Neighborhoods Infrastructure Impact Fee - Tier 1",
  "Eastern Neighborhoods Infrastructure Impact Fee - Tier 1 for 65 feet. Tier 2 for 85 feet.",
  "Eastern Neighborhoods Infrastructure Impact Fee - Tier 1 if residential, 3 if non-residential",
  "Eastern Neighborhoods Infrastructure Impact Fee",
  "Market and Octavia Community Infrastructure Impact Fee",
  "Rincon Hill Community Infrastructure Impact Fee",
  "South of Market Area Community Stabilization Fee",
  "Transit Center Open Space Fee",
  "Transit Center Transportation and Street Improvement Fee",
  "Van Ness and Market Inclusionary Affordable Housing Fee",
  "Visitacion Valley Community Facilities and Infrastructure Impact Fee",
  "Downtown Park Fee",
  "Market and Octavia Inclusionary Affordable Housing Fee",
  "UMU District Affordable Housing Fee - Tier A",
  "UMU District Affordable Housing Fee - Tier B",
  "UMU District Affordable Housing Fee - Tier C",
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

async function loadFeeGeos() {
  return Promise.all(FEE_LIST.map(getFeeGeo));
}

$(document).ready(async function () {
  console.log(await loadFeeGeos());
});

/*
$(document).ready(async function () {
  // initial example
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
*/
