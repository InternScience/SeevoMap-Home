import * as assert from "node:assert/strict";
import {
  getPublicDomainAnchor,
  getSemanticMaturityBand,
  projectSemanticNode,
} from "../src/utils/graphSemanticLayout";
import type { MapNode } from "../src/utils/types";

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
assert.equal(getSemanticMaturityBand(hypothesisNode).key, "hypothesis_led");
assert.equal(getSemanticMaturityBand(executionNode).key, "execution_ready");

const projectedPhysics = projectSemanticNode(hypothesisNode);
const projectedInfo = projectSemanticNode(executionNode);

assert.ok(projectedPhysics.x > 0 && projectedPhysics.x < 1);
assert.ok(projectedPhysics.y > 0 && projectedPhysics.y < 1);
assert.ok(projectedInfo.x < projectedPhysics.x, "Information Science should sit left of Physics");
assert.ok(projectedInfo.y > projectedPhysics.y, "Execution-ready nodes should sit lower than hypothesis-led nodes");

console.log("graph semantic layout checks passed");
