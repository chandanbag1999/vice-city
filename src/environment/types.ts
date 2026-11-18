import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export interface TransformDescriptor {
  position: Vector3;
  rotationY?: number;
  scaling?: Vector3;
}

export type BuildingStyle = "commercial" | "residential" | "office" | "mixed";

export interface BuildingConfig {
  id: string;
  name: string;
  style: BuildingStyle;
  position: Vector3;
  width: number;
  depth: number;
  stories: number;
  floorHeight: number;
  facadeMaterialKey: string;
  trimMaterialKey: string;
  rotationY?: number;
  hasShopfront: boolean;
  hasAwning?: boolean;
  hasBalconies?: boolean;
  rooftopStyle: "water-tower" | "hvac-cluster" | "parapet-only" | "penthouse-hvac";
}

export interface PropInstance {
  position: Vector3;
  rotationY?: number;
  scale?: number;
}

export interface RoadSystemConfig {
  mainRoadLength: number;
  mainRoadWidth: number;
  crossRoadLength: number;
  crossRoadWidth: number;
  crossRoadZOffset: number;
  sidewalkWidth: number;
  curbHeight: number;
  curbWidth: number;
}
