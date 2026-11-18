export interface CameraConfig {
  /** Default camera follow distance from character anchor in meters */
  defaultDistance: number;
  /** Minimum follow distance when blocked by geometry */
  minDistance: number;
  /** Maximum follow distance when zoomed out */
  maxDistance: number;
  /** Vertical anchor height offset above character feet in meters */
  anchorHeight: number;
  /** Lateral shoulder offset in meters (0 for centered) */
  shoulderOffset: number;
  /** Field of View in radians */
  fov: number;
  /** Minimum pitch angle in radians (looking slightly upward) */
  minPitch: number;
  /** Maximum pitch angle in radians (looking downward from above) */
  maxPitch: number;
  /** Smoothing factor for camera position follow */
  positionDamping: number;
  /** Smoothing factor for distance zoom recovery */
  distanceRecoverySpeed: number;
  /** Cushion distance in meters from wall hit point to prevent near-plane clipping */
  collisionCushion: number;
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  defaultDistance: 4.2,
  minDistance: 0.7,
  maxDistance: 7.0,
  anchorHeight: 1.45,
  shoulderOffset: 0.0, // Centered third-person
  fov: 1.10, // ~63 degrees
  minPitch: -0.15, // ~ -8.5 degrees
  maxPitch: 1.35, // ~ 77 degrees
  positionDamping: 12.0,
  distanceRecoverySpeed: 6.0,
  collisionCushion: 0.25,
};
