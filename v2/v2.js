const FEE_LIST = [
  // "Balboa Park Community Infrastructure Impact Fee"
  "Eastern Neighborhoods Infrastructure Impact Fee",
];

const getFeeLocationParams = (feeName) => ({
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
});

const getFeeGeometryURL = (feeName) =>
  `https://sfplanninggis.org/arcgiswa/rest/services/ImpactFees/MapServer/0/query?${new URLSearchParams(
    getFeeLocationParams(feeName)
  ).toString()}`;

$(document).ready(async function () {
  // console.log("here!!");
  const locationArcgis = await fetch(
    "http://sfplanninggis.org/cpc_geocode/?search=555%20bryant%20st"
  ).then((d) => d.json());
  console.log("locationArcgis: ", locationArcgis);
  const locationGeo = Terraformer.arcgisToGeoJSON(
    locationArcgis.features?.[0]?.geometry
  );
  console.log("locationGeo", locationGeo);

  const feeName = FEE_LIST[0];
  const feeArcgis = await fetch(getFeeGeometryURL(feeName)).then((d) =>
    d.json()
  );
  console.log("-- feeGeomeytr = ", feeArcgis);
  const feeGeos = feeArcgis.features.map((f) =>
    Terraformer.arcgisToGeoJSON(f.geometry)
  );
  console.log("-- feeGeos = ", feeGeos);

  feeGeos.forEach((feeGeo) => {
    console.log("TESTING", locationGeo, feeGeo);
    console.log("Intersects: ", turf.booleanIntersects(locationGeo, feeGeo));
  });

  console.log("--- turf = ", turf);
});
