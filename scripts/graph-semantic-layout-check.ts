import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  getPublicDomainAnchor,
  getScaleAxisAnchor,
  getSemanticMaturityBands,
  getSemanticMaturityBand,
  layoutSemanticNodes,
  projectSemanticNode,
} from "../src/utils/graphSemanticLayout";
import { getNobelReferences } from "../src/utils/nobelReferences";
import type { MapData, MapNode } from "../src/utils/types";

const hypothesisNode: MapNode = {
  id: "hypothesis-node",
  label: "Try a new mechanism",
  x: 0,
  y: 0,
  domain: "physics",
  metric_name: "novelty_score",
  metric_value: 8.7,
  status: "hypothesis",
};

const executionNode: MapNode = {
  id: "execution-node",
  label: "Run the eval and keep the winning patch",
  x: 0,
  y: 0,
  domain: "pretraining",
  metric_name: "val_bpb",
  metric_value: 1.12,
  success: true,
  status: "approved",
};

assert.equal(getPublicDomainAnchor("pretraining").label, "Information Science");
assert.equal(getPublicDomainAnchor("physics").label, "Physics");
assert.equal(getScaleAxisAnchor("earth_space").label, "Celestial");
assert.equal(getScaleAxisAnchor("engineering").label, "Devices");
assert.equal(getScaleAxisAnchor("physics").label, "Quantum");
assert.equal(getSemanticMaturityBand(hypothesisNode).key, "hypothesis_led");
assert.equal(getSemanticMaturityBand(executionNode).key, "execution_ready");
assert.deepEqual(
  getSemanticMaturityBands().map((band) => Number(band.y.toFixed(2))),
  [0.18, 0.31, 0.46, 0.68],
  "Maturity bands should use the display-oriented spacing that keeps all four visual lanes populated",
);
assert.equal(
  getSemanticMaturityBands()[2]?.label,
  "Applied Development",
  "The third maturity band should use clearer English than the literal 'translation' wording",
);

const projectedPhysics = projectSemanticNode(hypothesisNode);
const projectedInfo = projectSemanticNode(executionNode);

assert.ok(projectedPhysics.x > 0 && projectedPhysics.x < 1);
assert.ok(projectedPhysics.y > 0 && projectedPhysics.y < 1);
assert.ok(
  projectedInfo.x < projectedPhysics.x,
  "Systems-scale information nodes should sit left of quantum-scale physics nodes",
);
assert.ok(projectedInfo.y > projectedPhysics.y, "Execution-ready nodes should sit lower than hypothesis-led nodes");
assert.ok(
  getScaleAxisAnchor("earth_space").x < getScaleAxisAnchor("engineering").x &&
    getScaleAxisAnchor("engineering").x < getScaleAxisAnchor("physics").x,
  "Scale axis should run from macro earth-space work toward micro physics work",
);

const mapPath = path.resolve(process.cwd(), "dist/map.json");
const map = JSON.parse(fs.readFileSync(mapPath, "utf8")) as MapData;
const semanticNodes = layoutSemanticNodes(map.nodes);

assert.ok(
  Math.min(...semanticNodes.map((item) => item.x)) < 0.25,
  "The scale map should reach the macro side of the scene",
);
assert.ok(
  Math.max(...semanticNodes.map((item) => item.x)) > 0.75,
  "The scale map should reach the micro side of the scene",
);
assert.ok(
  Math.min(...semanticNodes.map((item) => item.y)) < 0.2,
  "The scene should preserve a clear foundational-theory top edge",
);
assert.ok(
  Math.max(...semanticNodes.map((item) => item.y)) > 0.64,
  "The scene should preserve a clear lower clinical-engineering region",
);
assert.ok(
  new Set(semanticNodes.map((item) => item.scaleAnchor.label)).size >= 7,
  "The bundled map should occupy most of the new scale-axis labels",
);

const meanXByDomain = (label: string) => {
  const items = semanticNodes.filter(
    (item) => getPublicDomainAnchor(item.node.domain).label === label,
  );
  return items.reduce((sum, item) => sum + item.x, 0) / items.length;
};
const meanYByDomain = (label: string) => {
  const items = semanticNodes.filter(
    (item) => getPublicDomainAnchor(item.node.domain).label === label,
  );
  return items.reduce((sum, item) => sum + item.y, 0) / items.length;
};

const bandOccupancy = getSemanticMaturityBands().map((band, index, bands) => {
  const minY = index === 0 ? 0 : (bands[index - 1].y + band.y) / 2;
  const maxY = index === bands.length - 1 ? 1 : (band.y + bands[index + 1].y) / 2;
  return semanticNodes.filter((item) => item.y >= minY && item.y < maxY).length;
});
const upperDomainRibbonOrder = [
  "Earth & Space",
  "Economics",
  "Engineering",
  "Chemistry",
  "Life Science",
  "Medicine",
  "Mathematics",
  "Physics",
];
const upperDomainRibbonMeans = upperDomainRibbonOrder.map((label) => meanXByDomain(label));
const upperDomainRibbonGaps = upperDomainRibbonMeans
  .slice(1)
  .map((value, index) => value - upperDomainRibbonMeans[index]);
const upperDomainRibbonWidth =
  upperDomainRibbonMeans[upperDomainRibbonMeans.length - 1] - upperDomainRibbonMeans[0];
const upperDomainRibbonCenterX =
  (upperDomainRibbonMeans[0] + upperDomainRibbonMeans[upperDomainRibbonMeans.length - 1]) / 2;
const upperDomainYMeans = upperDomainRibbonOrder.map((label) => meanYByDomain(label));
const upperDomainYGaps = upperDomainYMeans
  .slice(1)
  .map((value, index) => value - upperDomainYMeans[index]);
const upperDomainCloudStats = upperDomainRibbonOrder.map((label) => {
  const items = semanticNodes.filter(
    (item) => getPublicDomainAnchor(item.node.domain).label === label,
  );
  const xs = items.map((item) => item.x);
  const ys = items.map((item) => item.y);
  const spreadX = Math.max(...xs) - Math.min(...xs);
  const spreadY = Math.max(...ys) - Math.min(...ys);
  return {
    label,
    spreadX,
    spreadY,
    aspectRatio: spreadX / Math.max(spreadY, 1e-6),
  };
});
const upperOuterMeanY =
  (upperDomainYMeans[0] + upperDomainYMeans[1] + upperDomainYMeans[6] + upperDomainYMeans[7]) / 4;
const upperCenterMeanY = (upperDomainYMeans[3] + upperDomainYMeans[4]) / 2;
const upperShoulderMeanY = (upperDomainYMeans[2] + upperDomainYMeans[5]) / 2;

assert.ok(
  meanXByDomain("Earth & Space") < meanXByDomain("Engineering") &&
    meanXByDomain("Engineering") < meanXByDomain("Chemistry") &&
    meanXByDomain("Chemistry") < meanXByDomain("Life Science") &&
    meanXByDomain("Life Science") < meanXByDomain("Physics"),
  "Domain means should broadly follow the new macro-to-micro scale ordering",
);
assert.ok(
  Math.min(...bandOccupancy) >= 12,
  `Every displayed maturity band should retain at least a visible bridge of data points, got counts ${bandOccupancy.join(", ")}`,
);
assert.ok(
  Math.max(...bandOccupancy) <= 3300,
  `The display bands may emphasize the dominant overview cloud, but should not collapse into a single unlabeled lane, got counts ${bandOccupancy.join(", ")}`,
);
assert.ok(
  Math.max(...upperDomainRibbonGaps) <= 0.2,
  `The upper-domain canopy should not break into far-apart islands, got mean-x gaps ${upperDomainRibbonGaps
    .map((gap) => gap.toFixed(3))
    .join(", ")}`,
);
assert.ok(
  Math.min(...upperDomainRibbonGaps) > 0.02,
  `The upper-domain canopy should keep adjacent domains visually distinct, got mean-x gaps ${upperDomainRibbonGaps
    .map((gap) => gap.toFixed(3))
    .join(", ")}`,
);
assert.ok(
  upperDomainRibbonWidth < 0.58,
  `The upper canopy should read as a compact arch rather than a long horizontal ribbon, got width ${upperDomainRibbonWidth.toFixed(3)}`,
);
assert.ok(
  upperDomainRibbonWidth > 0.42,
  `The upper canopy should stay legible and not collapse into one stacked column, got width ${upperDomainRibbonWidth.toFixed(3)}`,
);
assert.ok(
  meanYByDomain("Medicine") < 0.5 && meanYByDomain("Engineering") < 0.46,
  "Upper scientific domains should stay in the mid-upper canopy instead of sinking into a detached lower island",
);
assert.ok(
  upperCenterMeanY < upperOuterMeanY - 0.025,
  `The upper canopy should arch upward in the middle instead of staying flat or drooping; center mean-y ${upperCenterMeanY.toFixed(3)} should be meaningfully above outer mean-y ${upperOuterMeanY.toFixed(3)}`,
);
assert.ok(
  upperShoulderMeanY < upperOuterMeanY - 0.01,
  `The canopy shoulders should sit above the outer edges instead of collapsing into a level band; shoulder mean-y ${upperShoulderMeanY.toFixed(3)} vs outer mean-y ${upperOuterMeanY.toFixed(3)}`,
);
assert.ok(
  Math.max(...upperDomainYGaps.map((gap) => Math.abs(gap))) < 0.14,
  `Adjacent upper-domain clusters should transition smoothly rather than jumping between strips; mean-y gaps ${upperDomainYGaps
    .map((gap) => gap.toFixed(3))
    .join(", ")}`,
);
assert.ok(
  upperDomainCloudStats.every((cloud) => cloud.aspectRatio < 2.2),
  `Upper-domain clusters should read as rounded clouds rather than horizontal bands; aspect ratios ${upperDomainCloudStats
    .map((cloud) => `${cloud.label}:${cloud.aspectRatio.toFixed(3)}`)
    .join(", ")}`,
);
assert.ok(
  upperDomainCloudStats.every((cloud) => cloud.aspectRatio > 0.48),
  `Upper-domain clusters should not collapse into vertical needles; aspect ratios ${upperDomainCloudStats
    .map((cloud) => `${cloud.label}:${cloud.aspectRatio.toFixed(3)}`)
    .join(", ")}`,
);

const repeatedMathBenchmark = semanticNodes.filter(
  (item) => item.node.label === "Maximize math reasoning accuracy via GRPO on Qwen2.5-Math-1.5B",
);
const repeatedMathXs = repeatedMathBenchmark.map((item) => item.x);
const repeatedMathYs = repeatedMathBenchmark.map((item) => item.y);
const repeatedPretrainingBenchmark = semanticNodes.filter(
  (item) => item.node.label === "Minimize val_loss for GPT-2 124M on FineWeb (1h budget)",
);
const repeatedPretrainingXs = repeatedPretrainingBenchmark.map((item) => item.x);
const repeatedPretrainingYs = repeatedPretrainingBenchmark.map((item) => item.y);
const repeatedPosttrainingBenchmark = semanticNodes.filter(
  (item) => item.node.label === "Maximize math reasoning accuracy via GRPO on Qwen2.5-Math-1.5B",
);
const repeatedPosttrainingXs = repeatedPosttrainingBenchmark.map((item) => item.x);
const repeatedPosttrainingYs = repeatedPosttrainingBenchmark.map((item) => item.y);
const modelCompressionNodes = semanticNodes.filter((item) => item.node.domain === "model_compression");
const repeatedPretrainingMeanX =
  repeatedPretrainingXs.reduce((sum, value) => sum + value, 0) / repeatedPretrainingXs.length;
const repeatedPretrainingMeanY =
  repeatedPretrainingYs.reduce((sum, value) => sum + value, 0) / repeatedPretrainingYs.length;
const repeatedPosttrainingMeanX =
  repeatedPosttrainingXs.reduce((sum, value) => sum + value, 0) / repeatedPosttrainingXs.length;
const repeatedPosttrainingMeanY =
  repeatedPosttrainingYs.reduce((sum, value) => sum + value, 0) / repeatedPosttrainingYs.length;
const repeatedPretrainingMinX = Math.min(...repeatedPretrainingXs);
const repeatedPretrainingMaxX = Math.max(...repeatedPretrainingXs);
const repeatedPretrainingMinY = Math.min(...repeatedPretrainingYs);
const repeatedPretrainingMaxY = Math.max(...repeatedPretrainingYs);
const repeatedPosttrainingMinX = Math.min(...repeatedPosttrainingXs);
const repeatedPosttrainingMaxX = Math.max(...repeatedPosttrainingXs);
const repeatedPosttrainingMinY = Math.min(...repeatedPosttrainingYs);
const repeatedPosttrainingMaxY = Math.max(...repeatedPosttrainingYs);
const informationCloudOverlapX =
  Math.min(repeatedPretrainingMaxX, repeatedPosttrainingMaxX) -
  Math.max(repeatedPretrainingMinX, repeatedPosttrainingMinX);
const informationCloudOverlapY =
  Math.min(repeatedPretrainingMaxY, repeatedPosttrainingMaxY) -
  Math.max(repeatedPretrainingMinY, repeatedPosttrainingMinY);
const informationCloudUnionWidth =
  Math.max(repeatedPretrainingMaxX, repeatedPosttrainingMaxX) -
  Math.min(repeatedPretrainingMinX, repeatedPosttrainingMinX);
const informationCloudUnionHeight =
  Math.max(repeatedPretrainingMaxY, repeatedPosttrainingMaxY) -
  Math.min(repeatedPretrainingMinY, repeatedPosttrainingMinY);
const informationCloudUnionAspectRatio =
  informationCloudUnionWidth / Math.max(informationCloudUnionHeight, 1e-6);
const informationCloudMeanY = (repeatedPretrainingMeanY + repeatedPosttrainingMeanY) / 2;
const informationCloudMeanX = (repeatedPretrainingMeanX + repeatedPosttrainingMeanX) / 2;
const modelCompressionMeanY =
  modelCompressionNodes.reduce((sum, item) => sum + item.y, 0) / Math.max(modelCompressionNodes.length, 1);
const modelCompressionMeanX =
  modelCompressionNodes.reduce((sum, item) => sum + item.x, 0) / Math.max(modelCompressionNodes.length, 1);
const nobelReferences = getNobelReferences();
const nobelPeripheryCount = nobelReferences.filter(
  (reference) =>
    reference.x < 0.31 || reference.x > 0.67 || reference.y < 0.28 || reference.y > 0.66,
).length;
const nobelInnerCount = nobelReferences.filter(
  (reference) =>
    reference.x > 0.39 && reference.x < 0.61 && reference.y > 0.29 && reference.y < 0.6,
).length;

assert.ok(repeatedMathBenchmark.length > 1000, "The bundled map should keep the large repeated math benchmark cohort");
assert.ok(
  repeatedPretrainingBenchmark.length > 1500,
  "The bundled map should keep the large repeated pretraining benchmark cohort",
);
assert.ok(
  Math.max(...repeatedPretrainingXs) - Math.min(...repeatedPretrainingXs) < 0.2,
  "Repeated pretraining benchmark nodes should stay as one rounded basin instead of spreading into a long lane",
);
assert.ok(
  Math.max(...repeatedPretrainingYs) - Math.min(...repeatedPretrainingYs) < 0.16,
  "Repeated pretraining benchmark nodes should stay vertically coherent while still allowing a looser rounded overview cloud",
);
assert.ok(
  Math.max(...repeatedMathXs) - Math.min(...repeatedMathXs) < 0.24,
  "Repeated math benchmark nodes should form one coherent information-science cluster instead of spanning the whole map",
);
assert.ok(
  Math.max(...repeatedMathYs) - Math.min(...repeatedMathYs) < 0.18,
  "Repeated math benchmark nodes should stay vertically coherent instead of filling multiple maturity bands",
);
assert.ok(
  Math.max(...repeatedMathXs) < 0.62,
  "Posttraining math benchmark nodes should not drift into chemistry or life-science territory",
);
assert.ok(
  Math.max(...repeatedPosttrainingXs) - Math.min(...repeatedPosttrainingXs) < 0.2,
  "Repeated posttraining benchmark nodes should read as one cohesive rounded cloud instead of a broad island chain",
);
assert.ok(
  Math.max(...repeatedPosttrainingYs) - Math.min(...repeatedPosttrainingYs) < 0.16,
  "Repeated posttraining benchmark nodes should stay vertically cohesive instead of leaking across multiple lanes",
);
assert.ok(
  Math.abs(repeatedPretrainingMeanX - repeatedPosttrainingMeanX) < 0.06,
  `The two giant information-science clouds should stay horizontally close enough to read as one dense mass, got mean-x distance ${Math.abs(repeatedPretrainingMeanX - repeatedPosttrainingMeanX).toFixed(3)}`,
);
assert.ok(
  Math.abs(repeatedPretrainingMeanY - repeatedPosttrainingMeanY) < 0.09,
  `The two giant information-science clouds should not separate into different vertical islands, got mean-y distance ${Math.abs(repeatedPretrainingMeanY - repeatedPosttrainingMeanY).toFixed(3)}`,
);
assert.ok(
  informationCloudOverlapX >= 0.12,
  `The two giant information-science clouds should now heavily overlap on x so the lower basin reads as one shared round mass, got overlap ${informationCloudOverlapX.toFixed(3)}`,
);
assert.ok(
  informationCloudOverlapY > 0.1,
  `The two giant information-science clouds should heavily overlap on y instead of stacking as detached layers, got overlap ${informationCloudOverlapY.toFixed(3)}`,
);
assert.ok(
  informationCloudUnionWidth > 0.16 && informationCloudUnionWidth < 0.24,
  `The combined information-science cloud should now stay broad enough to reduce visual density while remaining one basin, got union width ${informationCloudUnionWidth.toFixed(3)}`,
);
assert.ok(
  informationCloudUnionHeight > 0.12 && informationCloudUnionHeight < 0.19,
  `The combined information-science cloud should have a noticeable vertical thickness without smearing everywhere, got union height ${informationCloudUnionHeight.toFixed(3)}`,
);
assert.ok(
  informationCloudUnionAspectRatio < 1.7,
  `The combined information-science cloud should read as a rounded oval instead of a flat strip or square block, got aspect ratio ${informationCloudUnionAspectRatio.toFixed(3)}`,
);
assert.ok(
  informationCloudMeanY < 0.66,
  `The lower information basin should sit closer to the main frontier field instead of hanging too low, got mean-y ${informationCloudMeanY.toFixed(3)}`,
);
assert.ok(
  informationCloudMeanY - upperShoulderMeanY < 0.44,
  `The upper canopy and lower basin should read as one tighter scene instead of two distant islands, got gap ${(informationCloudMeanY - upperShoulderMeanY).toFixed(3)}`,
);
assert.ok(
  Math.abs(informationCloudMeanX - upperDomainRibbonCenterX) < 0.07,
  `The lower information basin should sit beneath the upper arch instead of drifting off-center, got lower mean-x ${informationCloudMeanX.toFixed(3)} vs canopy center ${upperDomainRibbonCenterX.toFixed(3)}`,
);
assert.ok(
  modelCompressionMeanY > 0.45 && modelCompressionMeanY < 0.54,
  `Model compression should act as a visible bridge cluster between the main canopy and lower basin, got mean-y ${modelCompressionMeanY.toFixed(3)}`,
);
assert.ok(
  modelCompressionMeanX > informationCloudMeanX + 0.04,
  `The bridge cluster should lean toward the center of the frontier field instead of staying inside the lower basin, got info mean-x ${informationCloudMeanX.toFixed(3)} and bridge mean-x ${modelCompressionMeanX.toFixed(3)}`,
);
assert.ok(
  nobelPeripheryCount / Math.max(nobelReferences.length, 1) >= 0.72,
  `Most Nobel beacons should sit on the outer ring of the scene, got periphery ratio ${(nobelPeripheryCount / Math.max(nobelReferences.length, 1)).toFixed(3)}`,
);
assert.ok(
  nobelReferences.length >= 10,
  `The outer Nobel ring should still have enough landmarks to frame the scene, got ${nobelReferences.length}`,
);
assert.ok(
  nobelInnerCount <= 8,
  `Too many Nobel beacons remain in the interior of the field, got ${nobelInnerCount}`,
);
assert.ok(
  meanXByDomain("Mathematics") > 0.68,
  "Pure mathematics nodes should sit in a tighter math lane on the micro side of the map",
);

console.log("graph semantic layout checks passed");
