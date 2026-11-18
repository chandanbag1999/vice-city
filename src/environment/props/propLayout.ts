import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PropInstance } from "../types";

// Sidewalk elevation is Y = 0.18m
const SIDEWALK_Y = 0.18;

/**
 * Street Lamps Layout:
 * West lamps face East (arm points toward road: rotationY = -Math.PI / 2)
 * East lamps face West (arm points toward road: rotationY = Math.PI / 2)
 */
export const STREET_LAMP_INSTANCES: PropInstance[] = [
  // West Sidewalk Lamps
  { position: new Vector3(-4.9, SIDEWALK_Y, -30.0), rotationY: -Math.PI / 2 },
  { position: new Vector3(-4.9, SIDEWALK_Y, -18.0), rotationY: -Math.PI / 2 },
  { position: new Vector3(-4.9, SIDEWALK_Y, -6.0), rotationY: -Math.PI / 2 },
  { position: new Vector3(-4.9, SIDEWALK_Y, 6.0), rotationY: -Math.PI / 2 },
  { position: new Vector3(-4.9, SIDEWALK_Y, 18.0), rotationY: -Math.PI / 2 },
  { position: new Vector3(-4.9, SIDEWALK_Y, 30.0), rotationY: -Math.PI / 2 },

  // East Sidewalk Lamps
  { position: new Vector3(4.9, SIDEWALK_Y, -28.0), rotationY: Math.PI / 2 },
  { position: new Vector3(4.9, SIDEWALK_Y, -16.0), rotationY: Math.PI / 2 },
  { position: new Vector3(4.9, SIDEWALK_Y, 0.5), rotationY: Math.PI / 2 },
  { position: new Vector3(4.9, SIDEWALK_Y, 15.5), rotationY: Math.PI / 2 },
  { position: new Vector3(4.9, SIDEWALK_Y, 28.0), rotationY: Math.PI / 2 },

  // Side Street Lamps
  { position: new Vector3(14.0, SIDEWALK_Y, 3.5), rotationY: 0 },
  { position: new Vector3(14.0, SIDEWALK_Y, 12.5), rotationY: Math.PI },
];

/**
 * Urban Trees in Concrete Planters
 */
export const TREE_INSTANCES: PropInstance[] = [
  // West Sidewalk Trees
  { position: new Vector3(-6.8, SIDEWALK_Y, -24.0), rotationY: 0.3 },
  { position: new Vector3(-6.8, SIDEWALK_Y, -12.0), rotationY: 1.1 },
  { position: new Vector3(-6.8, SIDEWALK_Y, 0.0), rotationY: 2.2 },
  { position: new Vector3(-6.8, SIDEWALK_Y, 12.0), rotationY: 0.8 },
  { position: new Vector3(-6.8, SIDEWALK_Y, 24.0), rotationY: 1.7 },

  // East Sidewalk Trees
  { position: new Vector3(6.8, SIDEWALK_Y, -22.0), rotationY: 0.5 },
  { position: new Vector3(6.8, SIDEWALK_Y, -10.0), rotationY: 2.5 },
  { position: new Vector3(6.8, SIDEWALK_Y, 20.0), rotationY: 1.4 },
  { position: new Vector3(6.8, SIDEWALK_Y, 32.0), rotationY: 0.9 },

  // Side Street Trees
  { position: new Vector3(18.0, SIDEWALK_Y, 2.0), rotationY: 0.4 },
  { position: new Vector3(18.0, SIDEWALK_Y, 14.0), rotationY: 2.1 },
];

/**
 * Park Benches
 */
export const BENCH_INSTANCES: PropInstance[] = [
  // West side facing Avenue (East: rotationY = Math.PI / 2)
  { position: new Vector3(-7.2, SIDEWALK_Y, -15.0), rotationY: Math.PI / 2 },
  { position: new Vector3(-7.2, SIDEWALK_Y, 3.0), rotationY: Math.PI / 2 },
  { position: new Vector3(-7.2, SIDEWALK_Y, 19.0), rotationY: Math.PI / 2 },

  // East side facing Avenue (West: rotationY = -Math.PI / 2)
  { position: new Vector3(7.2, SIDEWALK_Y, -19.0), rotationY: -Math.PI / 2 },
  { position: new Vector3(7.2, SIDEWALK_Y, 23.0), rotationY: -Math.PI / 2 },

  // Side street bench facing North
  { position: new Vector3(11.0, SIDEWALK_Y, 2.0), rotationY: 0 },
];

/**
 * Waste Bins
 */
export const TRASH_BIN_INSTANCES: PropInstance[] = [
  { position: new Vector3(-5.1, SIDEWALK_Y, -27.0), rotationY: 0 },
  { position: new Vector3(-5.1, SIDEWALK_Y, -3.0), rotationY: 0 },
  { position: new Vector3(-5.1, SIDEWALK_Y, 4.0), rotationY: 0 },
  { position: new Vector3(-5.1, SIDEWALK_Y, 27.0), rotationY: 0 },
  { position: new Vector3(5.1, SIDEWALK_Y, -26.0), rotationY: 0 },
  { position: new Vector3(5.1, SIDEWALK_Y, 1.5), rotationY: 0 },
  { position: new Vector3(5.1, SIDEWALK_Y, 14.5), rotationY: 0 },
  { position: new Vector3(5.1, SIDEWALK_Y, 26.0), rotationY: 0 },
];

/**
 * Traffic Signs (Stop signs and pedestrian crossing markers)
 */
export const TRAFFIC_SIGN_INSTANCES: PropInstance[] = [
  // South approach stop sign facing oncoming traffic (+Z)
  { position: new Vector3(4.8, SIDEWALK_Y, -0.5), rotationY: Math.PI },
  // North approach stop sign facing oncoming traffic (-Z)
  { position: new Vector3(-4.8, SIDEWALK_Y, 16.5), rotationY: 0 },
  // Side street stop sign facing East (+X)
  { position: new Vector3(5.5, SIDEWALK_Y, 3.5), rotationY: -Math.PI / 2 },
  // Pedestrian crossing indicator sign
  { position: new Vector3(-4.8, SIDEWALK_Y, 1.5), rotationY: 0 },
];

/**
 * Decorative Sidewalk Planter Flower Boxes
 */
export const PLANTER_INSTANCES: PropInstance[] = [
  { position: new Vector3(-7.6, SIDEWALK_Y, -20.0), rotationY: 0 },
  { position: new Vector3(-7.6, SIDEWALK_Y, -8.0), rotationY: 0 },
  { position: new Vector3(-7.6, SIDEWALK_Y, 9.0), rotationY: 0 },
  { position: new Vector3(-7.6, SIDEWALK_Y, 25.0), rotationY: 0 },
  { position: new Vector3(7.6, SIDEWALK_Y, -14.0), rotationY: 0 },
  { position: new Vector3(7.6, SIDEWALK_Y, 18.0), rotationY: 0 },
];
