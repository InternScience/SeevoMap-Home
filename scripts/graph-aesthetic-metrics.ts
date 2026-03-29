import * as fs from "node:fs";
import * as path from "node:path";
import { layoutSemanticNodes } from "../src/utils/graphSemanticLayout";
import { getNobelReferences } from "../src/utils/nobelReferences";
import { getPublicDomainLabel } from "../src/utils/publicDomains";
import type { MapData } from "../src/utils/types";

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function range(values: number[]): { min: number; max: number; span: number } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max, span: max - min };
}

const mapPath = path.resolve(process.cwd(), "dist/map.json");
const map = JSON.parse(fs.readFileSync(mapPath, "utf8")) as MapData;
const semanticNodes = layoutSemanticNodes(map.nodes);
const nobelReferences = getNobelReferences();

const canopyOrder = [
  "Earth & Space",
  "Economics",
  "Engineering",
  "Chemistry",
  "Life Science",
  "Medicine",
  "Mathematics",
  "Physics",
];

const canopyMeans = canopyOrder.map((label) => {
  const items = semanticNodes.filter((item) => getPublicDomainLabel(item.node.domain) === label);
  return {
    label,
    meanX: mean(items.map((item) => item.x)),
    meanY: mean(items.map((item) => item.y)),
  };
});

const upperDomainClouds = canopyOrder.map((label) => {
  const items = semanticNodes.filter((item) => getPublicDomainLabel(item.node.domain) === label);
  const xs = items.map((item) => item.x);
  const ys = items.map((item) => item.y);
  const xRange = range(xs);
  const yRange = range(ys);
  const area = xRange.span * yRange.span;
  return {
    label,
    meanX: mean(xs),
    meanY: mean(ys),
    spreadX: xRange.span,
    spreadY: yRange.span,
    aspectRatio: xRange.span / Math.max(yRange.span, 1e-6),
    area,
  };
});

const canopyGaps = canopyMeans.slice(1).map((item, index) => item.meanX - canopyMeans[index].meanX);
const canopyYGaps = canopyMeans.slice(1).map((item, index) => item.meanY - canopyMeans[index].meanY);
const canopyWidth =
  (canopyMeans[canopyMeans.length - 1]?.meanX ?? 0) - (canopyMeans[0]?.meanX ?? 0);
const canopyCenterX =
  ((canopyMeans[0]?.meanX ?? 0) + (canopyMeans[canopyMeans.length - 1]?.meanX ?? 0)) / 2;
const outerCanopyMeanY = mean([
  canopyMeans[0]?.meanY ?? 0,
  canopyMeans[1]?.meanY ?? 0,
  canopyMeans[6]?.meanY ?? 0,
  canopyMeans[7]?.meanY ?? 0,
]);
const centerCanopyMeanY = mean([
  canopyMeans[3]?.meanY ?? 0,
  canopyMeans[4]?.meanY ?? 0,
]);
const shoulderCanopyMeanY = mean([
  canopyMeans[2]?.meanY ?? 0,
  canopyMeans[5]?.meanY ?? 0,
]);

const pretraining = semanticNodes.filter(
  (item) => item.node.label === "Minimize val_loss for GPT-2 124M on FineWeb (1h budget)",
);
const posttraining = semanticNodes.filter(
  (item) => item.node.label === "Maximize math reasoning accuracy via GRPO on Qwen2.5-Math-1.5B",
);

const preX = range(pretraining.map((item) => item.x));
const preY = range(pretraining.map((item) => item.y));
const postX = range(posttraining.map((item) => item.x));
const postY = range(posttraining.map((item) => item.y));
const modelCompression = semanticNodes.filter((item) => item.node.domain === "model_compression");

const overlapX = Math.min(preX.max, postX.max) - Math.max(preX.min, postX.min);
const overlapY = Math.min(preY.max, postY.max) - Math.max(preY.min, postY.min);
const unionWidth = Math.max(preX.max, postX.max) - Math.min(preX.min, postX.min);
const unionHeight = Math.max(preY.max, postY.max) - Math.min(preY.min, postY.min);
const unionAspectRatio = unionWidth / Math.max(unionHeight, 1e-6);
const informationMeanY = mean([
  mean(pretraining.map((item) => item.y)),
  mean(posttraining.map((item) => item.y)),
]);
const informationMeanX = mean([
  mean(pretraining.map((item) => item.x)),
  mean(posttraining.map((item) => item.x)),
]);
const nobelPeripheryCount = nobelReferences.filter(
  (reference) =>
    reference.x < 0.31 || reference.x > 0.67 || reference.y < 0.28 || reference.y > 0.66,
).length;
const nobelInnerCount = nobelReferences.filter(
  (reference) =>
    reference.x > 0.39 && reference.x < 0.61 && reference.y > 0.29 && reference.y < 0.6,
).length;

console.log(
  JSON.stringify(
    {
      canopy: {
        means: canopyMeans.map((item) => ({
          ...item,
          meanX: Number(item.meanX.toFixed(3)),
          meanY: Number(item.meanY.toFixed(3)),
        })),
        clouds: upperDomainClouds.map((item) => ({
          label: item.label,
          meanX: Number(item.meanX.toFixed(3)),
          meanY: Number(item.meanY.toFixed(3)),
          spreadX: Number(item.spreadX.toFixed(3)),
          spreadY: Number(item.spreadY.toFixed(3)),
          aspectRatio: Number(item.aspectRatio.toFixed(3)),
          area: Number(item.area.toFixed(4)),
        })),
        gaps: canopyGaps.map((gap) => Number(gap.toFixed(3))),
        yGaps: canopyYGaps.map((gap) => Number(gap.toFixed(3))),
        maxGap: Number(Math.max(...canopyGaps).toFixed(3)),
        minGap: Number(Math.min(...canopyGaps).toFixed(3)),
        width: Number(canopyWidth.toFixed(3)),
        centerX: Number(canopyCenterX.toFixed(3)),
        maxAbsYGap: Number(Math.max(...canopyYGaps.map((gap) => Math.abs(gap))).toFixed(3)),
        outerMeanY: Number(outerCanopyMeanY.toFixed(3)),
        centerMeanY: Number(centerCanopyMeanY.toFixed(3)),
        shoulderMeanY: Number(shoulderCanopyMeanY.toFixed(3)),
      },
      informationCloud: {
        meanX: Number(informationMeanX.toFixed(3)),
        meanY: Number(informationMeanY.toFixed(3)),
        centerOffsetFromCanopy: Number(Math.abs(informationMeanX - canopyCenterX).toFixed(3)),
        gapToShoulder: Number((informationMeanY - shoulderCanopyMeanY).toFixed(3)),
        pretrainingMeanX: Number(mean(pretraining.map((item) => item.x)).toFixed(3)),
        pretrainingMeanY: Number(mean(pretraining.map((item) => item.y)).toFixed(3)),
        pretrainingSpreadX: Number(preX.span.toFixed(3)),
        pretrainingSpreadY: Number(preY.span.toFixed(3)),
        posttrainingMeanX: Number(mean(posttraining.map((item) => item.x)).toFixed(3)),
        posttrainingMeanY: Number(mean(posttraining.map((item) => item.y)).toFixed(3)),
        posttrainingSpreadX: Number(postX.span.toFixed(3)),
        posttrainingSpreadY: Number(postY.span.toFixed(3)),
        centroidGapX: Number(Math.abs(mean(pretraining.map((item) => item.x)) - mean(posttraining.map((item) => item.x))).toFixed(3)),
        centroidGapY: Number(Math.abs(mean(pretraining.map((item) => item.y)) - mean(posttraining.map((item) => item.y))).toFixed(3)),
        overlapX: Number(overlapX.toFixed(3)),
        overlapY: Number(overlapY.toFixed(3)),
        unionWidth: Number(unionWidth.toFixed(3)),
        unionHeight: Number(unionHeight.toFixed(3)),
        unionAspectRatio: Number(unionAspectRatio.toFixed(3)),
      },
      bridges: {
        modelCompressionMeanX: Number(mean(modelCompression.map((item) => item.x)).toFixed(3)),
        modelCompressionMeanY: Number(mean(modelCompression.map((item) => item.y)).toFixed(3)),
      },
      nobel: {
        count: nobelReferences.length,
        peripheryCount: nobelPeripheryCount,
        peripheryRatio: Number((nobelPeripheryCount / Math.max(nobelReferences.length, 1)).toFixed(3)),
        innerCount: nobelInnerCount,
      },
    },
    null,
    2,
  ),
);
