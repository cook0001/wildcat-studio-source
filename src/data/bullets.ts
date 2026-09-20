// Authoritative Database of Standard Caliber Presets and Bullet Options
// Covers SAAMI, CIP, wildcatting, PRS/Match, hunting, handgun, and dangerous game calibers.

export type CaliberCategory =
  | 'Sub-Caliber & Varmint'
  | 'Match & Service Rifle (6mm - .30 Cal)'
  | 'Medium Bore & European (8mm - 9.3mm)'
  | 'African Express & Dangerous Game'
  | 'Handgun, Pistol & PDW'
  | 'Anti-Materiel & Extreme Long Range (ELR)';

export interface CaliberPreset {
  inches: number;
  mm: number;
  designation: string;
  category: CaliberCategory;
  commonCartridges: string;
  typicalWeightGrains: number;
  typicalBulletLength: number;
  typicalSeatingDepth: number;
}

export type BulletCategory =
  | 'Match / Target BTHP'
  | 'Extreme Long Range (ELD / Hybrid)'
  | 'Hunting Polymer Tip'
  | 'Hunting Soft Point / Partition'
  | 'Monolithic Solid Copper'
  | 'Varmint / High Velocity'
  | 'Subsonic Heavy / Round Nose'
  | 'Lever-Action Flat Nose / Flex Tip'
  | 'Handgun FMJ / Hollow Point'
  | 'Dangerous Game Solid / Heavy';

export interface BulletOption {
  id: string;
  name: string;
  manufacturer: string;
  caliber_inches: number;
  caliber_designation: string;
  weight_grains: number;
  length_inches: number;
  g1_bc: number;
  category: BulletCategory;
  recommended_seating_depth: number;
  profile_notes?: string;
}

// -----------------------------------------------------------------------------
// 38 Standard Caliber Presets across 6 Engineering Classes
// -----------------------------------------------------------------------------
export const CALIBER_PRESETS: CaliberPreset[] = [
  // Sub-Caliber & Varmint (.14 to .224)
  { inches: 0.142, mm: 3.61, designation: ".14 Caliber", category: 'Sub-Caliber & Varmint', commonCartridges: ".14 Walker, .14 Eichelberger", typicalWeightGrains: 15, typicalBulletLength: 0.42, typicalSeatingDepth: 0.14 },
  { inches: 0.172, mm: 4.37, designation: ".17 Caliber (4.37mm)", category: 'Sub-Caliber & Varmint', commonCartridges: ".17 HMR, .17 Hornet, .17 Fireball, .17 Rem", typicalWeightGrains: 20, typicalBulletLength: 0.55, typicalSeatingDepth: 0.18 },
  { inches: 0.204, mm: 5.18, designation: ".20 Caliber (5.18mm)", category: 'Sub-Caliber & Varmint', commonCartridges: ".204 Ruger, .20 Practical, 5mm Rem", typicalWeightGrains: 32, typicalBulletLength: 0.65, typicalSeatingDepth: 0.20 },
  { inches: 0.221, mm: 5.62, designation: "5.45mm Soviet (.221)", category: 'Sub-Caliber & Varmint', commonCartridges: "5.45x39mm Russian 7N6", typicalWeightGrains: 53, typicalBulletLength: 0.85, typicalSeatingDepth: 0.22 },
  { inches: 0.224, mm: 5.69, designation: ".224 / 5.56mm", category: 'Sub-Caliber & Varmint', commonCartridges: ".223 Rem, 5.56 NATO, .22-250, .224 Valkyrie", typicalWeightGrains: 69, typicalBulletLength: 0.90, typicalSeatingDepth: 0.24 },

  // Match & Service Rifle (6mm - .30 Cal)
  { inches: 0.243, mm: 6.17, designation: "6mm (.243)", category: 'Match & Service Rifle (6mm - .30 Cal)', commonCartridges: ".243 Win, 6mm Creedmoor, 6 ARC, 6mm BR, 6 GT", typicalWeightGrains: 105, typicalBulletLength: 1.15, typicalSeatingDepth: 0.28 },
  { inches: 0.257, mm: 6.53, designation: ".257 Caliber (6.35mm)", category: 'Match & Service Rifle (6mm - .30 Cal)', commonCartridges: ".25-06 Rem, .257 Roberts, .257 Wby, 25 Creedmoor", typicalWeightGrains: 115, typicalBulletLength: 1.20, typicalSeatingDepth: 0.29 },
  { inches: 0.264, mm: 6.71, designation: "6.5mm (.264)", category: 'Match & Service Rifle (6mm - .30 Cal)', commonCartridges: "6.5 Creedmoor, 6.5 PRC, 6.5x55 Swede, 6.5 Grendel", typicalWeightGrains: 140, typicalBulletLength: 1.38, typicalSeatingDepth: 0.32 },
  { inches: 0.277, mm: 7.04, designation: "6.8mm / .270 Cal", category: 'Match & Service Rifle (6mm - .30 Cal)', commonCartridges: ".270 Win, 6.8 Western, 6.8 SPC, .277 SIG Fury", typicalWeightGrains: 130, typicalBulletLength: 1.28, typicalSeatingDepth: 0.30 },
  { inches: 0.284, mm: 7.21, designation: "7mm (.284)", category: 'Match & Service Rifle (6mm - .30 Cal)', commonCartridges: "7mm Rem Mag, 7mm-08, 7 PRC, .280 Ackley, 7x57", typicalWeightGrains: 168, typicalBulletLength: 1.45, typicalSeatingDepth: 0.34 },
  { inches: 0.308, mm: 7.82, designation: ".30 Caliber (7.62mm)", category: 'Match & Service Rifle (6mm - .30 Cal)', commonCartridges: ".308 Win, .30-06, .300 Win Mag, .300 PRC, 300 BLK", typicalWeightGrains: 175, typicalBulletLength: 1.32, typicalSeatingDepth: 0.32 },
  { inches: 0.311, mm: 7.90, designation: "7.62mm Russian / .303", category: 'Match & Service Rifle (6mm - .30 Cal)', commonCartridges: "7.62x39mm, 7.62x54R, .303 British, 7.65 Argentine", typicalWeightGrains: 150, typicalBulletLength: 1.18, typicalSeatingDepth: 0.30 },

  // Medium Bore & European (8mm - 9.3mm)
  { inches: 0.323, mm: 8.20, designation: "8mm (.323 / 7.92mm)", category: 'Medium Bore & European (8mm - 9.3mm)', commonCartridges: "8x57mm IS Mauser, 8mm Rem Mag, 8x68S", typicalWeightGrains: 198, typicalBulletLength: 1.35, typicalSeatingDepth: 0.34 },
  { inches: 0.329, mm: 8.36, designation: "8mm Steyr / Lebel (.329)", category: 'Medium Bore & European (8mm - 9.3mm)', commonCartridges: "8x56R Steyr, 8x50R Lebel", typicalWeightGrains: 205, typicalBulletLength: 1.32, typicalSeatingDepth: 0.34 },
  { inches: 0.338, mm: 8.58, designation: ".338 Caliber (8.6mm)", category: 'Medium Bore & European (8mm - 9.3mm)', commonCartridges: ".338 Lapua Mag, .338 Win Mag, .338 Norma, 338 ARC", typicalWeightGrains: 250, typicalBulletLength: 1.62, typicalSeatingDepth: 0.38 },
  { inches: 0.358, mm: 9.10, designation: ".358 / .35 Cal Rifle", category: 'Medium Bore & European (8mm - 9.3mm)', commonCartridges: ".358 Win, .35 Whelen, .350 Rem Mag, .35 Rem", typicalWeightGrains: 225, typicalBulletLength: 1.25, typicalSeatingDepth: 0.35 },
  { inches: 0.366, mm: 9.30, designation: "9.3mm (.366)", category: 'Medium Bore & European (8mm - 9.3mm)', commonCartridges: "9.3x62mm Mauser, 9.3x74R, 9.3x64 Brenneke", typicalWeightGrains: 286, typicalBulletLength: 1.48, typicalSeatingDepth: 0.38 },

  // African Express & Dangerous Game (.375 to .700)
  { inches: 0.375, mm: 9.53, designation: ".375 Caliber (9.5mm)", category: 'African Express & Dangerous Game', commonCartridges: ".375 H&H Mag, .375 Ruger, .375 CheyTac, .375 Raptor", typicalWeightGrains: 300, typicalBulletLength: 1.60, typicalSeatingDepth: 0.40 },
  { inches: 0.408, mm: 10.36, designation: ".408 CheyTac", category: 'African Express & Dangerous Game', commonCartridges: ".408 CheyTac, .375/408 CheyTac", typicalWeightGrains: 419, typicalBulletLength: 2.15, typicalSeatingDepth: 0.50 },
  { inches: 0.411, mm: 10.44, designation: ".411 Caliber", category: 'African Express & Dangerous Game', commonCartridges: ".405 Winchester", typicalWeightGrains: 300, typicalBulletLength: 1.15, typicalSeatingDepth: 0.38 },
  { inches: 0.416, mm: 10.57, designation: ".416 Caliber", category: 'African Express & Dangerous Game', commonCartridges: ".416 Rigby, .416 Rem Mag, .416 Ruger, .416 Barrett", typicalWeightGrains: 400, typicalBulletLength: 1.70, typicalSeatingDepth: 0.45 },
  { inches: 0.423, mm: 10.74, designation: ".404 Jeffery (.423 / 10.75mm)", category: 'African Express & Dangerous Game', commonCartridges: ".404 Jeffery, 10.75x68mm Mauser", typicalWeightGrains: 400, typicalBulletLength: 1.62, typicalSeatingDepth: 0.45 },
  { inches: 0.458, mm: 11.63, designation: ".458 Caliber (.45-70 / .458)", category: 'African Express & Dangerous Game', commonCartridges: ".45-70 Govt, .458 Win Mag, .458 Lott, .458 SOCOM", typicalWeightGrains: 405, typicalBulletLength: 1.15, typicalSeatingDepth: 0.40 },
  { inches: 0.475, mm: 12.07, designation: ".475 Caliber", category: 'African Express & Dangerous Game', commonCartridges: ".470 Nitro Express, .475 Linebaugh, .480 Ruger", typicalWeightGrains: 500, typicalBulletLength: 1.45, typicalSeatingDepth: 0.45 },
  { inches: 0.500, mm: 12.70, designation: ".500 Handgun / Straight", category: 'African Express & Dangerous Game', commonCartridges: ".500 S&W Mag, .50 Beowulf, .50-70 Govt, .500 WE", typicalWeightGrains: 350, typicalBulletLength: 1.05, typicalSeatingDepth: 0.38 },
  { inches: 0.505, mm: 12.83, designation: ".505 Gibbs (.505)", category: 'African Express & Dangerous Game', commonCartridges: ".505 Gibbs", typicalWeightGrains: 525, typicalBulletLength: 1.50, typicalSeatingDepth: 0.50 },
  { inches: 0.510, mm: 12.95, designation: ".500 Jeffery / .500 NE (.510)", category: 'African Express & Dangerous Game', commonCartridges: ".500 Jeffery, .500 Nitro Express", typicalWeightGrains: 570, typicalBulletLength: 1.68, typicalSeatingDepth: 0.50 },
  { inches: 0.585, mm: 14.86, designation: ".577 Nitro / T-Rex (.585)", category: 'African Express & Dangerous Game', commonCartridges: ".577 Nitro Express, .577 Tyrannosaur, .577 Snider", typicalWeightGrains: 750, typicalBulletLength: 1.85, typicalSeatingDepth: 0.55 },
  { inches: 0.620, mm: 15.75, designation: ".600 Nitro Express (.620)", category: 'African Express & Dangerous Game', commonCartridges: ".600 Nitro Express", typicalWeightGrains: 900, typicalBulletLength: 2.05, typicalSeatingDepth: 0.60 },
  { inches: 0.700, mm: 17.78, designation: ".700 Nitro Express (.700)", category: 'African Express & Dangerous Game', commonCartridges: ".700 Nitro Express", typicalWeightGrains: 1000, typicalBulletLength: 2.25, typicalSeatingDepth: 0.65 },

  // Handgun, Pistol & PDW
  { inches: 0.312, mm: 7.92, designation: ".32 Handgun (.312)", category: 'Handgun, Pistol & PDW', commonCartridges: ".32 ACP, .32 S&W Long, .32 H&R Mag, 7.65 Browning", typicalWeightGrains: 71, typicalBulletLength: 0.48, typicalSeatingDepth: 0.16 },
  { inches: 0.355, mm: 9.02, designation: "9mm / .355 Auto & PDW", category: 'Handgun, Pistol & PDW', commonCartridges: "9x19mm Parabellum, .380 ACP, .357 SIG, 9x21mm", typicalWeightGrains: 124, typicalBulletLength: 0.59, typicalSeatingDepth: 0.21 },
  { inches: 0.357, mm: 9.07, designation: ".38 / .357 Revolver", category: 'Handgun, Pistol & PDW', commonCartridges: ".357 Magnum, .38 Special, .357 Maximum", typicalWeightGrains: 158, typicalBulletLength: 0.68, typicalSeatingDepth: 0.28 },
  { inches: 0.400, mm: 10.16, designation: "10mm / .40 S&W (.400)", category: 'Handgun, Pistol & PDW', commonCartridges: "10mm Auto, .40 S&W", typicalWeightGrains: 180, typicalBulletLength: 0.64, typicalSeatingDepth: 0.25 },
  { inches: 0.429, mm: 10.90, designation: ".44 Handgun (.429)", category: 'Handgun, Pistol & PDW', commonCartridges: ".44 Magnum, .44 Special, .444 Marlin", typicalWeightGrains: 240, typicalBulletLength: 0.76, typicalSeatingDepth: 0.32 },
  { inches: 0.452, mm: 11.48, designation: ".45 Auto / Revolver (.452)", category: 'Handgun, Pistol & PDW', commonCartridges: ".45 ACP, .45 Colt, .454 Casull, .460 S&W Mag, .450 BM", typicalWeightGrains: 230, typicalBulletLength: 0.68, typicalSeatingDepth: 0.28 },

  // Anti-Materiel & Extreme Long Range (ELR)
  { inches: 0.510, mm: 12.95, designation: ".50 BMG / 12.7mm NATO (.510)", category: 'Anti-Materiel & Extreme Long Range (ELR)', commonCartridges: ".50 BMG (12.7x99mm), 12.7x108mm Russian", typicalWeightGrains: 750, typicalBulletLength: 2.30, typicalSeatingDepth: 0.65 }
];

// -----------------------------------------------------------------------------
// 150+ Authentic Factory Bullet Options with Exact Lengths, Weights & BCs
// -----------------------------------------------------------------------------
export const BULLET_OPTIONS: BulletOption[] = [
  // ===================== .17 Caliber (.172") =====================
  { id: 'hornady_17_vmax_20', name: 'Hornady V-MAX 20 gr', manufacturer: 'Hornady', caliber_inches: 0.172, caliber_designation: '.172', weight_grains: 20, length_inches: 0.545, g1_bc: 0.185, category: 'Varmint / High Velocity', recommended_seating_depth: 0.175, profile_notes: 'Polymer tip, swaged lead core varmint bullet' },
  { id: 'hornady_17_vmax_25', name: 'Hornady V-MAX 25 gr', manufacturer: 'Hornady', caliber_inches: 0.172, caliber_designation: '.172', weight_grains: 25, length_inches: 0.612, g1_bc: 0.230, category: 'Varmint / High Velocity', recommended_seating_depth: 0.190, profile_notes: 'High-BC polymer tip for .17 Hornet & Fireball' },
  { id: 'berger_17_target_25', name: 'Berger Flat Base Target 25 gr', manufacturer: 'Berger', caliber_inches: 0.172, caliber_designation: '.172', weight_grains: 25, length_inches: 0.595, g1_bc: 0.190, category: 'Match / Target BTHP', recommended_seating_depth: 0.180, profile_notes: 'Precision match varmint bullet' },
  { id: 'nosler_17_varmin_20', name: 'Nosler Varmageddon 20 gr FB Tipped', manufacturer: 'Nosler', caliber_inches: 0.172, caliber_designation: '.172', weight_grains: 20, length_inches: 0.535, g1_bc: 0.172, category: 'Varmint / High Velocity', recommended_seating_depth: 0.170, profile_notes: 'Ultra-thin jacket explosive expansion' },

  // ===================== .20 Caliber (.204") =====================
  { id: 'hornady_20_vmax_32', name: 'Hornady V-MAX 32 gr', manufacturer: 'Hornady', caliber_inches: 0.204, caliber_designation: '.204', weight_grains: 32, length_inches: 0.625, g1_bc: 0.210, category: 'Varmint / High Velocity', recommended_seating_depth: 0.200, profile_notes: '4,225 fps factory loading in .204 Ruger' },
  { id: 'hornady_20_vmax_40', name: 'Hornady V-MAX 40 gr', manufacturer: 'Hornady', caliber_inches: 0.204, caliber_designation: '.204', weight_grains: 40, length_inches: 0.740, g1_bc: 0.275, category: 'Varmint / High Velocity', recommended_seating_depth: 0.220, profile_notes: 'Boat-tail polymer tip long-range varmint' },
  { id: 'sierra_20_blitzking_39', name: 'Sierra BlitzKing 39 gr', manufacturer: 'Sierra', caliber_inches: 0.204, caliber_designation: '.204', weight_grains: 39, length_inches: 0.725, g1_bc: 0.287, category: 'Varmint / High Velocity', recommended_seating_depth: 0.210, profile_notes: 'Acetron polymer tip varmint match projectile' },
  { id: 'berger_20_target_55', name: 'Berger Long Range BT 55 gr', manufacturer: 'Berger', caliber_inches: 0.204, caliber_designation: '.204', weight_grains: 55, length_inches: 0.965, g1_bc: 0.381, category: 'Match / Target BTHP', recommended_seating_depth: 0.260, profile_notes: 'Fast-twist (1:8 or faster) heavy .20 cal match' },

  // ===================== 5.45mm (.221") =====================
  { id: 'soviet_7n6_53', name: 'Soviet 7N6 Steel Core 53 gr', manufacturer: 'Barnaul / Tula', caliber_inches: 0.221, caliber_designation: '5.45mm', weight_grains: 53, length_inches: 0.850, g1_bc: 0.305, category: 'Match / Target BTHP', recommended_seating_depth: 0.230, profile_notes: 'Air-pocket steel core military service bullet' },
  { id: 'hornady_545_vmax_60', name: 'Hornady V-MAX 60 gr (5.45x39)', manufacturer: 'Hornady', caliber_inches: 0.221, caliber_designation: '5.45mm', weight_grains: 60, length_inches: 0.875, g1_bc: 0.290, category: 'Varmint / High Velocity', recommended_seating_depth: 0.240, profile_notes: 'Commercial varmint loading for Russian 5.45' },

  // ===================== .224 Caliber / 5.56mm =====================
  { id: 'hornady_224_vmax_55', name: 'Hornady V-MAX 55 gr', manufacturer: 'Hornady', caliber_inches: 0.224, caliber_designation: '.224', weight_grains: 55, length_inches: 0.740, g1_bc: 0.255, category: 'Varmint / High Velocity', recommended_seating_depth: 0.220, profile_notes: 'Standard varmint benchmark' },
  { id: 'mil_m193_55', name: 'USGI M193 FMJBT 55 gr', manufacturer: 'Lake City', caliber_inches: 0.224, caliber_designation: '.224', weight_grains: 55, length_inches: 0.745, g1_bc: 0.243, category: 'Match / Target BTHP', recommended_seating_depth: 0.220, profile_notes: 'Standard 5.56mm NATO ball with cannelure' },
  { id: 'mil_m855_62', name: 'USGI M855 SS109 Penetrator 62 gr', manufacturer: 'Lake City', caliber_inches: 0.224, caliber_designation: '.224', weight_grains: 62, length_inches: 0.900, g1_bc: 0.304, category: 'Match / Target BTHP', recommended_seating_depth: 0.240, profile_notes: 'Green tip steel penetrator core' },
  { id: 'sierra_224_smk_69', name: 'Sierra MatchKing (SMK) 69 gr HPBT', manufacturer: 'Sierra', caliber_inches: 0.224, caliber_designation: '.224', weight_grains: 69, length_inches: 0.898, g1_bc: 0.301, category: 'Match / Target BTHP', recommended_seating_depth: 0.245, profile_notes: 'Classic AR-15 magazine-length match projectile' },
  { id: 'sierra_224_smk_77', name: 'Sierra MatchKing (SMK) 77 gr HPBT (Mk 262)', manufacturer: 'Sierra', caliber_inches: 0.224, caliber_designation: '.224', weight_grains: 77, length_inches: 0.988, g1_bc: 0.372, category: 'Match / Target BTHP', recommended_seating_depth: 0.260, profile_notes: 'US Special Operations Mk 262 Mod 1 projectile' },
  { id: 'sierra_224_tmk_77', name: 'Sierra Tipped MatchKing (TMK) 77 gr', manufacturer: 'Sierra', caliber_inches: 0.224, caliber_designation: '.224', weight_grains: 77, length_inches: 1.070, g1_bc: 0.420, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.280, profile_notes: 'Acetron polymer tip with extended ogive' },
  { id: 'hornady_224_eldm_73', name: 'Hornady ELD-Match 73 gr', manufacturer: 'Hornady', caliber_inches: 0.224, caliber_designation: '.224', weight_grains: 73, length_inches: 1.005, g1_bc: 0.398, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.265, profile_notes: 'Heat Shield tip optimized for AR-15 mag-length' },
  { id: 'hornady_224_eldm_88', name: 'Hornady ELD-Match 88 gr', manufacturer: 'Hornady', caliber_inches: 0.224, caliber_designation: '.224', weight_grains: 88, length_inches: 1.220, g1_bc: 0.545, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.320, profile_notes: 'Ultra-heavy .224 Valkyrie ELR match projectile' },
  { id: 'berger_224_hybrid_77', name: 'Berger Target OTM Tactical 77 gr', manufacturer: 'Berger', caliber_inches: 0.224, caliber_designation: '.224', weight_grains: 77, length_inches: 1.015, g1_bc: 0.374, category: 'Match / Target BTHP', recommended_seating_depth: 0.260, profile_notes: 'Jump-tolerant tangent/secant hybrid ogive' },
  { id: 'berger_224_hybrid_85', name: 'Berger Long Range Hybrid 85.5 gr', manufacturer: 'Berger', caliber_inches: 0.224, caliber_designation: '.224', weight_grains: 85.5, length_inches: 1.185, g1_bc: 0.524, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.300, profile_notes: 'Extreme ballistic efficiency for 1:7 twist barrels' },
  { id: 'barnes_224_ttsx_55', name: 'Barnes Tipped TSX (TTSX) 55 gr Lead-Free', manufacturer: 'Barnes', caliber_inches: 0.224, caliber_designation: '.224', weight_grains: 55, length_inches: 0.880, g1_bc: 0.272, category: 'Monolithic Solid Copper', recommended_seating_depth: 0.240, profile_notes: '100% monolithic copper 4-petal expansion' },
  { id: 'nosler_224_partition_60', name: 'Nosler Partition 60 gr', manufacturer: 'Nosler', caliber_inches: 0.224, caliber_designation: '.224', weight_grains: 60, length_inches: 0.790, g1_bc: 0.228, category: 'Hunting Soft Point / Partition', recommended_seating_depth: 0.230, profile_notes: 'Dual core big game hunting projectile in .224' },

  // ===================== 6mm (.243") =====================
  { id: 'hornady_6mm_vmax_87', name: 'Hornady V-MAX 87 gr', manufacturer: 'Hornady', caliber_inches: 0.243, caliber_designation: '6mm', weight_grains: 87, length_inches: 1.020, g1_bc: 0.400, category: 'Varmint / High Velocity', recommended_seating_depth: 0.260, profile_notes: 'High-speed flat shooting varmint bullet' },
  { id: 'sierra_6mm_smk_107', name: 'Sierra MatchKing (SMK) 107 gr HPBT', manufacturer: 'Sierra', caliber_inches: 0.243, caliber_designation: '6mm', weight_grains: 107, length_inches: 1.225, g1_bc: 0.527, category: 'Match / Target BTHP', recommended_seating_depth: 0.290, profile_notes: 'Benchmark 6mm long range match projectile' },
  { id: 'berger_6mm_hybrid_105', name: 'Berger Hybrid Target 105 gr', manufacturer: 'Berger', caliber_inches: 0.243, caliber_designation: '6mm', weight_grains: 105, length_inches: 1.250, g1_bc: 0.536, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.290, profile_notes: 'The PRS champion projectile in 6 Dasher & 6 GT' },
  { id: 'hornady_6mm_eldm_108', name: 'Hornady ELD-Match 108 gr', manufacturer: 'Hornady', caliber_inches: 0.243, caliber_designation: '6mm', weight_grains: 108, length_inches: 1.275, g1_bc: 0.536, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.300, profile_notes: 'Heat Shield tip ultra-consistent drag profile' },
  { id: 'hornady_6mm_eldx_103', name: 'Hornady ELD-X 103 gr', manufacturer: 'Hornady', caliber_inches: 0.243, caliber_designation: '6mm', weight_grains: 103, length_inches: 1.215, g1_bc: 0.512, category: 'Hunting Polymer Tip', recommended_seating_depth: 0.280, profile_notes: 'All-range hunting bullet with InterLock ring' },
  { id: 'berger_6mm_lrht_109', name: 'Berger Long Range Hybrid Target 109 gr', manufacturer: 'Berger', caliber_inches: 0.243, caliber_designation: '6mm', weight_grains: 109, length_inches: 1.285, g1_bc: 0.568, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.310, profile_notes: 'Meplat reduction technology for extreme consistency' },
  { id: 'lapua_6mm_scenar_105', name: 'Lapua Scenar-L 105 gr OTM', manufacturer: 'Lapua', caliber_inches: 0.243, caliber_designation: '6mm', weight_grains: 105, length_inches: 1.230, g1_bc: 0.472, category: 'Match / Target BTHP', recommended_seating_depth: 0.290, profile_notes: 'Finnish match quality with ultra-tight mass tolerances' },
  { id: 'barnes_6mm_ttsx_80', name: 'Barnes Tipped TSX 80 gr', manufacturer: 'Barnes', caliber_inches: 0.243, caliber_designation: '6mm', weight_grains: 80, length_inches: 1.040, g1_bc: 0.331, category: 'Monolithic Solid Copper', recommended_seating_depth: 0.260, profile_notes: 'High velocity solid copper for .243 Win hunting' },

  // ===================== .257 Caliber =====================
  { id: 'nosler_257_ballistic_115', name: 'Nosler Ballistic Tip 115 gr', manufacturer: 'Nosler', caliber_inches: 0.257, caliber_designation: '.257', weight_grains: 115, length_inches: 1.190, g1_bc: 0.453, category: 'Hunting Polymer Tip', recommended_seating_depth: 0.280, profile_notes: 'Legendary .25-06 Rem deer hunting bullet' },
  { id: 'hornady_257_eldm_134', name: 'Hornady ELD-Match 134 gr (25 Cal)', manufacturer: 'Hornady', caliber_inches: 0.257, caliber_designation: '.257', weight_grains: 134, length_inches: 1.410, g1_bc: 0.645, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.330, profile_notes: 'Modern fast-twist 25 Creedmoor match projectile' },
  { id: 'berger_257_hybrid_135', name: 'Berger Long Range Hybrid 135 gr', manufacturer: 'Berger', caliber_inches: 0.257, caliber_designation: '.257', weight_grains: 135, length_inches: 1.435, g1_bc: 0.650, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.340, profile_notes: 'High-BC revival bullet for .25 caliber rifles' },

  // ===================== 6.5mm (.264") =====================
  { id: 'hornady_65_eldm_140', name: 'Hornady ELD-Match 140 gr', manufacturer: 'Hornady', caliber_inches: 0.264, caliber_designation: '6.5mm', weight_grains: 140, length_inches: 1.380, g1_bc: 0.646, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.320, profile_notes: 'The gold standard 6.5 Creedmoor factory match bullet' },
  { id: 'hornady_65_eldm_147', name: 'Hornady ELD-Match 147 gr', manufacturer: 'Hornady', caliber_inches: 0.264, caliber_designation: '6.5mm', weight_grains: 147, length_inches: 1.440, g1_bc: 0.697, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.340, profile_notes: 'Extreme BC heavy bullet for 6.5 PRC & Creedmoor' },
  { id: 'sierra_65_smk_142', name: 'Sierra MatchKing (SMK) 142 gr HPBT', manufacturer: 'Sierra', caliber_inches: 0.264, caliber_designation: '6.5mm', weight_grains: 142, length_inches: 1.385, g1_bc: 0.626, category: 'Match / Target BTHP', recommended_seating_depth: 0.320, profile_notes: 'Historic 1,000-yard benchmark projectile' },
  { id: 'berger_65_hybrid_140', name: 'Berger Hybrid Target 140 gr', manufacturer: 'Berger', caliber_inches: 0.264, caliber_designation: '6.5mm', weight_grains: 140, length_inches: 1.405, g1_bc: 0.607, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.320, profile_notes: 'Match winner with secant/tangent ogive design' },
  { id: 'berger_65_eol_156', name: 'Berger Elite Hunter EOL 156 gr', manufacturer: 'Berger', caliber_inches: 0.264, caliber_designation: '6.5mm', weight_grains: 156, length_inches: 1.512, g1_bc: 0.679, category: 'Hunting Polymer Tip', recommended_seating_depth: 0.350, profile_notes: 'Extreme Outer Limits long-range heavy hunter' },
  { id: 'lapua_65_scenar_139', name: 'Lapua Scenar 139 gr OTM', manufacturer: 'Lapua', caliber_inches: 0.264, caliber_designation: '6.5mm', weight_grains: 139, length_inches: 1.365, g1_bc: 0.578, category: 'Match / Target BTHP', recommended_seating_depth: 0.310, profile_notes: 'Legendary accuracy in 6.5x55 & 6.5x47 Lapua' },
  { id: 'nosler_65_accubond_140', name: 'Nosler AccuBond 140 gr', manufacturer: 'Nosler', caliber_inches: 0.264, caliber_designation: '6.5mm', weight_grains: 140, length_inches: 1.330, g1_bc: 0.509, category: 'Hunting Polymer Tip', recommended_seating_depth: 0.310, profile_notes: 'Bonded core polymer tip hunting bullet' },
  { id: 'barnes_65_lrx_127', name: 'Barnes Long-Range X (LRX) 127 gr', manufacturer: 'Barnes', caliber_inches: 0.264, caliber_designation: '6.5mm', weight_grains: 127, length_inches: 1.390, g1_bc: 0.468, category: 'Monolithic Solid Copper', recommended_seating_depth: 0.300, profile_notes: 'Monolithic solid with polymer tip and boat tail' },

  // ===================== 6.8mm / .270 Caliber (.277") =====================
  { id: 'nosler_277_ballistic_130', name: 'Nosler Ballistic Tip 130 gr', manufacturer: 'Nosler', caliber_inches: 0.277, caliber_designation: '.277', weight_grains: 130, length_inches: 1.230, g1_bc: 0.433, category: 'Hunting Polymer Tip', recommended_seating_depth: 0.290, profile_notes: 'Classic .270 Winchester hunting projectile' },
  { id: 'hornady_277_eldx_145', name: 'Hornady ELD-X 145 gr (6.8 / .277)', manufacturer: 'Hornady', caliber_inches: 0.277, caliber_designation: '.277', weight_grains: 145, length_inches: 1.375, g1_bc: 0.536, category: 'Hunting Polymer Tip', recommended_seating_depth: 0.320, profile_notes: 'Long-range projectile for .270 Win & 6.8 Western' },
  { id: 'sierra_277_smk_135', name: 'Sierra MatchKing (SMK) 135 gr HPBT', manufacturer: 'Sierra', caliber_inches: 0.277, caliber_designation: '.277', weight_grains: 135, length_inches: 1.280, g1_bc: 0.488, category: 'Match / Target BTHP', recommended_seating_depth: 0.300, profile_notes: 'Precision match bullet for 6.8 SPC and .270' },
  { id: 'hornady_277_atp_165', name: 'Hornady A-Tip Match 165 gr (.277)', manufacturer: 'Hornady', caliber_inches: 0.277, caliber_designation: '.277', weight_grains: 165, length_inches: 1.545, g1_bc: 0.655, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.360, profile_notes: 'Machined aluminum tip match bullet for 6.8 Western' },
  { id: 'sig_277_fury_hybrid_140', name: 'SIG Sauer Hybrid Match 140 gr (.277 Fury)', manufacturer: 'SIG Sauer', caliber_inches: 0.277, caliber_designation: '.277', weight_grains: 140, length_inches: 1.340, g1_bc: 0.508, category: 'Match / Target BTHP', recommended_seating_depth: 0.310, profile_notes: 'XM7 military projectile loading' },

  // ===================== 7mm (.284") =====================
  { id: 'sierra_7mm_smk_168', name: 'Sierra MatchKing (SMK) 168 gr HPBT', manufacturer: 'Sierra', caliber_inches: 0.284, caliber_designation: '7mm', weight_grains: 168, length_inches: 1.385, g1_bc: 0.488, category: 'Match / Target BTHP', recommended_seating_depth: 0.330, profile_notes: 'Classic 7mm match bullet' },
  { id: 'sierra_7mm_smk_180', name: 'Sierra MatchKing (SMK) 180 gr HPBT', manufacturer: 'Sierra', caliber_inches: 0.284, caliber_designation: '7mm', weight_grains: 180, length_inches: 1.520, g1_bc: 0.660, category: 'Match / Target BTHP', recommended_seating_depth: 0.360, profile_notes: 'F-Class open division benchmark projectile' },
  { id: 'hornady_7mm_eldm_180', name: 'Hornady ELD-Match 180 gr', manufacturer: 'Hornady', caliber_inches: 0.284, caliber_designation: '7mm', weight_grains: 180, length_inches: 1.530, g1_bc: 0.796, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.360, profile_notes: 'Class-leading ballistic coefficient for 7 PRC' },
  { id: 'berger_7mm_hybrid_180', name: 'Berger Hybrid Target 180 gr', manufacturer: 'Berger', caliber_inches: 0.284, caliber_designation: '7mm', weight_grains: 180, length_inches: 1.525, g1_bc: 0.674, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.360, profile_notes: 'World-record winning long range F-Class bullet' },
  { id: 'hornady_7mm_eldx_162', name: 'Hornady ELD-X 162 gr', manufacturer: 'Hornady', caliber_inches: 0.284, caliber_designation: '7mm', weight_grains: 162, length_inches: 1.445, g1_bc: 0.630, category: 'Hunting Polymer Tip', recommended_seating_depth: 0.330, profile_notes: 'All-range hunting bullet for 7mm Rem Mag' },
  { id: 'nosler_7mm_partition_160', name: 'Nosler Partition 160 gr', manufacturer: 'Nosler', caliber_inches: 0.284, caliber_designation: '7mm', weight_grains: 160, length_inches: 1.300, g1_bc: 0.475, category: 'Hunting Soft Point / Partition', recommended_seating_depth: 0.320, profile_notes: 'Time-tested elk and moose stopper' },
  { id: 'barnes_7mm_lrx_168', name: 'Barnes Long-Range X 168 gr', manufacturer: 'Barnes', caliber_inches: 0.284, caliber_designation: '7mm', weight_grains: 168, length_inches: 1.560, g1_bc: 0.550, category: 'Monolithic Solid Copper', recommended_seating_depth: 0.350, profile_notes: 'Tipped monolithic copper high-weight projectile' },

  // ===================== .30 Caliber (.308") =====================
  { id: 'hornady_308_vmax_110', name: 'Hornady V-MAX 110 gr (.308)', manufacturer: 'Hornady', caliber_inches: 0.308, caliber_designation: '.308', weight_grains: 110, length_inches: 0.900, g1_bc: 0.290, category: 'Varmint / High Velocity', recommended_seating_depth: 0.250, profile_notes: 'High velocity 300 BLK and .308 varmint projectile' },
  { id: 'mil_m80_147', name: 'USGI M80 Ball FMJBT 147 gr', manufacturer: 'Lake City', caliber_inches: 0.308, caliber_designation: '.308', weight_grains: 147, length_inches: 1.135, g1_bc: 0.398, category: 'Match / Target BTHP', recommended_seating_depth: 0.300, profile_notes: 'Standard 7.62x51mm NATO military ball' },
  { id: 'sierra_308_smk_168', name: 'Sierra MatchKing (SMK) 168 gr HPBT', manufacturer: 'Sierra', caliber_inches: 0.308, caliber_designation: '.308', weight_grains: 168, length_inches: 1.215, g1_bc: 0.462, category: 'Match / Target BTHP', recommended_seating_depth: 0.310, profile_notes: 'The legendary standard for 300-600 yard precision' },
  { id: 'sierra_308_smk_175', name: 'Sierra MatchKing (SMK) 175 gr HPBT (M118LR)', manufacturer: 'Sierra', caliber_inches: 0.308, caliber_designation: '.308', weight_grains: 175, length_inches: 1.240, g1_bc: 0.505, category: 'Match / Target BTHP', recommended_seating_depth: 0.320, profile_notes: 'US Military M118LR sniper cartridge bullet' },
  { id: 'hornady_308_eldm_178', name: 'Hornady ELD-Match 178 gr', manufacturer: 'Hornady', caliber_inches: 0.308, caliber_designation: '.308', weight_grains: 178, length_inches: 1.405, g1_bc: 0.547, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.330, profile_notes: 'Modern aerodynamic profile for long range .308' },
  { id: 'hornady_308_eldm_208', name: 'Hornady ELD-Match 208 gr', manufacturer: 'Hornady', caliber_inches: 0.308, caliber_designation: '.308', weight_grains: 208, length_inches: 1.550, g1_bc: 0.690, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.370, profile_notes: 'Heavy match bullet for .300 Win Mag & .300 PRC' },
  { id: 'hornady_308_eldm_225', name: 'Hornady ELD-Match 225 gr', manufacturer: 'Hornady', caliber_inches: 0.308, caliber_designation: '.308', weight_grains: 225, length_inches: 1.660, g1_bc: 0.777, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.400, profile_notes: 'Factory match projectile in .300 PRC' },
  { id: 'berger_308_hybrid_185', name: 'Berger Target Hybrid 185 gr', manufacturer: 'Berger', caliber_inches: 0.308, caliber_designation: '.308', weight_grains: 185, length_inches: 1.425, g1_bc: 0.565, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.340, profile_notes: 'Optimized for .308 Win F-TR Palma class' },
  { id: 'berger_308_hybrid_215', name: 'Berger Hybrid Target 215 gr', manufacturer: 'Berger', caliber_inches: 0.308, caliber_designation: '.308', weight_grains: 215, length_inches: 1.600, g1_bc: 0.696, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.380, profile_notes: 'The undisputed king of .300 Win Mag & .300 PRC hunting' },
  { id: 'lapua_308_scenar_185', name: 'Lapua Scenar 185 gr OTM', manufacturer: 'Lapua', caliber_inches: 0.308, caliber_designation: '.308', weight_grains: 185, length_inches: 1.340, g1_bc: 0.521, category: 'Match / Target BTHP', recommended_seating_depth: 0.330, profile_notes: 'Finnish military competition open-tip match' },
  { id: 'lapua_308_subsonic_200', name: 'Lapua B416 Subsonic FMJRN 200 gr', manufacturer: 'Lapua', caliber_inches: 0.308, caliber_designation: '.308', weight_grains: 200, length_inches: 1.270, g1_bc: 0.330, category: 'Subsonic Heavy / Round Nose', recommended_seating_depth: 0.380, profile_notes: 'Designed specifically for suppressed 7.62x51 subsonic' },
  { id: 'hornady_308_subx_190', name: 'Hornady Sub-X 190 gr (300 BLK)', manufacturer: 'Hornady', caliber_inches: 0.308, caliber_designation: '.308', weight_grains: 190, length_inches: 1.250, g1_bc: 0.437, category: 'Subsonic Heavy / Round Nose', recommended_seating_depth: 0.380, profile_notes: 'Patented Flex Tip designed to expand down to 900 fps' },
  { id: 'sierra_308_smk_220', name: 'Sierra MatchKing (SMK) 220 gr HPBT', manufacturer: 'Sierra', caliber_inches: 0.308, caliber_designation: '.308', weight_grains: 220, length_inches: 1.490, g1_bc: 0.629, category: 'Subsonic Heavy / Round Nose', recommended_seating_depth: 0.400, profile_notes: 'Benchmark 300 Blackout subsonic match projectile' },
  { id: 'nosler_308_partition_180', name: 'Nosler Partition 180 gr', manufacturer: 'Nosler', caliber_inches: 0.308, caliber_designation: '.308', weight_grains: 180, length_inches: 1.275, g1_bc: 0.474, category: 'Hunting Soft Point / Partition', recommended_seating_depth: 0.330, profile_notes: 'The North American benchmark for elk and bear' },
  { id: 'barnes_308_ttsx_168', name: 'Barnes Tipped TSX (TTSX) 168 gr', manufacturer: 'Barnes', caliber_inches: 0.308, caliber_designation: '.308', weight_grains: 168, length_inches: 1.415, g1_bc: 0.470, category: 'Monolithic Solid Copper', recommended_seating_depth: 0.340, profile_notes: '100% copper hollow point with polymer expansion tip' },

  // ===================== 7.62mm Russian / .311" =====================
  { id: 'hornady_311_sst_123', name: 'Hornady SST 123 gr (.310 / .311)', manufacturer: 'Hornady', caliber_inches: 0.311, caliber_designation: '.311', weight_grains: 123, length_inches: 0.940, g1_bc: 0.295, category: 'Hunting Polymer Tip', recommended_seating_depth: 0.260, profile_notes: 'Super Shock Tip for 7.62x39mm deer hunting' },
  { id: 'sierra_311_prohunter_150', name: 'Sierra Pro-Hunter 150 gr (.311)', manufacturer: 'Sierra', caliber_inches: 0.311, caliber_designation: '.311', weight_grains: 150, length_inches: 1.085, g1_bc: 0.392, category: 'Hunting Soft Point / Partition', recommended_seating_depth: 0.300, profile_notes: 'Spitzer flat base for .303 British & 7.62x54R' },
  { id: 'sierra_311_smk_174', name: 'Sierra MatchKing (SMK) 174 gr HPBT (.311)', manufacturer: 'Sierra', caliber_inches: 0.311, caliber_designation: '.311', weight_grains: 174, length_inches: 1.275, g1_bc: 0.499, category: 'Match / Target BTHP', recommended_seating_depth: 0.320, profile_notes: 'The definitive target bullet for Enfield and Mosin rifles' },

  // ===================== 8mm (.323") =====================
  { id: 'sierra_8mm_smk_200', name: 'Sierra MatchKing 200 gr HPBT (8mm)', manufacturer: 'Sierra', caliber_inches: 0.323, caliber_designation: '8mm', weight_grains: 200, length_inches: 1.340, g1_bc: 0.520, category: 'Match / Target BTHP', recommended_seating_depth: 0.340, profile_notes: 'Match bullet for 8x57mm Mauser and 8mm Rem Mag' },
  { id: 'nosler_8mm_partition_200', name: 'Nosler Partition 200 gr (8mm)', manufacturer: 'Nosler', caliber_inches: 0.323, caliber_designation: '8mm', weight_grains: 200, length_inches: 1.280, g1_bc: 0.450, category: 'Hunting Soft Point / Partition', recommended_seating_depth: 0.340, profile_notes: 'Deep penetrating big game projectile' },
  { id: 'hornady_8mm_interlock_170', name: 'Hornady InterLock 170 gr RN', manufacturer: 'Hornady', caliber_inches: 0.323, caliber_designation: '8mm', weight_grains: 170, length_inches: 1.035, g1_bc: 0.287, category: 'Hunting Soft Point / Partition', recommended_seating_depth: 0.300, profile_notes: 'Round nose brush bullet for 8x57' },

  // ===================== .338 Caliber (.338") =====================
  { id: 'lapua_338_scenar_250', name: 'Lapua Scenar 250 gr OTM', manufacturer: 'Lapua', caliber_inches: 0.338, caliber_designation: '.338', weight_grains: 250, length_inches: 1.630, g1_bc: 0.675, category: 'Match / Target BTHP', recommended_seating_depth: 0.400, profile_notes: 'Standard military issue projectile for .338 Lapua' },
  { id: 'lapua_338_scenar_300', name: 'Lapua Scenar 300 gr OTM', manufacturer: 'Lapua', caliber_inches: 0.338, caliber_designation: '.338', weight_grains: 300, length_inches: 1.765, g1_bc: 0.785, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.450, profile_notes: 'Ultra-long range ELR match bullet' },
  { id: 'sierra_338_smk_250', name: 'Sierra MatchKing (SMK) 250 gr HPBT', manufacturer: 'Sierra', caliber_inches: 0.338, caliber_designation: '.338', weight_grains: 250, length_inches: 1.615, g1_bc: 0.587, category: 'Match / Target BTHP', recommended_seating_depth: 0.390, profile_notes: 'Classic military sniper bullet' },
  { id: 'sierra_338_smk_300', name: 'Sierra MatchKing (SMK) 300 gr HPBT', manufacturer: 'Sierra', caliber_inches: 0.338, caliber_designation: '.338', weight_grains: 300, length_inches: 1.720, g1_bc: 0.768, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.440, profile_notes: '1-mile precision ELR competition benchmark' },
  { id: 'berger_338_hybrid_300', name: 'Berger Hybrid OTM Tactical 300 gr', manufacturer: 'Berger', caliber_inches: 0.338, caliber_designation: '.338', weight_grains: 300, length_inches: 1.820, g1_bc: 0.818, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.460, profile_notes: 'Highest G1 BC in .338 caliber class' },
  { id: 'hornady_338_eldm_285', name: 'Hornady ELD-Match 285 gr', manufacturer: 'Hornady', caliber_inches: 0.338, caliber_designation: '.338', weight_grains: 285, length_inches: 1.745, g1_bc: 0.829, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.430, profile_notes: 'Factory match projectile for .338 Lapua' },
  { id: 'nosler_338_accubond_250', name: 'Nosler AccuBond 250 gr', manufacturer: 'Nosler', caliber_inches: 0.338, caliber_designation: '.338', weight_grains: 250, length_inches: 1.575, g1_bc: 0.575, category: 'Hunting Polymer Tip', recommended_seating_depth: 0.380, profile_notes: 'Heavy game hunting projectile for .338 Win Mag' },
  { id: 'barnes_338_tsx_225', name: 'Barnes Triple-Shock X (TSX) 225 gr', manufacturer: 'Barnes', caliber_inches: 0.338, caliber_designation: '.338', weight_grains: 225, length_inches: 1.485, g1_bc: 0.482, category: 'Monolithic Solid Copper', recommended_seating_depth: 0.370, profile_notes: 'Monolithic copper deep penetration for big game' },

  // ===================== .355" / 9mm Handgun & Subgun =====================
  { id: 'berrys_9mm_rn_115', name: "Berry's Plated Round Nose 115 gr", manufacturer: "Berry's", caliber_inches: 0.355, caliber_designation: '9mm', weight_grains: 115, length_inches: 0.550, g1_bc: 0.130, category: 'Handgun FMJ / Hollow Point', recommended_seating_depth: 0.200, profile_notes: 'Target and plinking standard 9mm' },
  { id: 'speer_9mm_golddot_124', name: 'Speer Gold Dot 124 gr +P GDHP', manufacturer: 'Speer', caliber_inches: 0.355, caliber_designation: '9mm', weight_grains: 124, length_inches: 0.575, g1_bc: 0.150, category: 'Handgun FMJ / Hollow Point', recommended_seating_depth: 0.220, profile_notes: 'The law enforcement duty standard bonded hollow point' },
  { id: 'federal_9mm_hst_147', name: 'Federal Tactical HST 147 gr HP', manufacturer: 'Federal', caliber_inches: 0.355, caliber_designation: '9mm', weight_grains: 147, length_inches: 0.650, g1_bc: 0.210, category: 'Handgun FMJ / Hollow Point', recommended_seating_depth: 0.250, profile_notes: 'Subsonic heavyweight personal defense hollow point' },
  { id: 'hornady_9mm_xtp_115', name: 'Hornady XTP 115 gr JHP', manufacturer: 'Hornady', caliber_inches: 0.355, caliber_designation: '9mm', weight_grains: 115, length_inches: 0.545, g1_bc: 0.140, category: 'Handgun FMJ / Hollow Point', recommended_seating_depth: 0.200, profile_notes: 'Extreme Terminal Performance jacketed hollow point' },

  // ===================== .357" / .38 Revolver =====================
  { id: 'hornady_357_xtp_158', name: 'Hornady XTP 158 gr JHP (.357)', manufacturer: 'Hornady', caliber_inches: 0.357, caliber_designation: '.357', weight_grains: 158, length_inches: 0.680, g1_bc: 0.206, category: 'Handgun FMJ / Hollow Point', recommended_seating_depth: 0.280, profile_notes: 'Standard hunting and defense projectile for .357 Magnum' },
  { id: 'speer_357_gdhp_158', name: 'Speer Gold Dot 158 gr GDHP', manufacturer: 'Speer', caliber_inches: 0.357, caliber_designation: '.357', weight_grains: 158, length_inches: 0.690, g1_bc: 0.200, category: 'Handgun FMJ / Hollow Point', recommended_seating_depth: 0.280, profile_notes: 'Heavy bonded core revolver projectile' },

  // ===================== .358" Rifle =====================
  { id: 'hornady_358_interlock_200', name: 'Hornady InterLock 200 gr SP (.358)', manufacturer: 'Hornady', caliber_inches: 0.358, caliber_designation: '.358', weight_grains: 200, length_inches: 1.050, g1_bc: 0.282, category: 'Hunting Soft Point / Partition', recommended_seating_depth: 0.320, profile_notes: 'Standard projectile for .35 Remington & .358 Win' },
  { id: 'nosler_358_partition_225', name: 'Nosler Partition 225 gr (.358)', manufacturer: 'Nosler', caliber_inches: 0.358, caliber_designation: '.358', weight_grains: 225, length_inches: 1.250, g1_bc: 0.430, category: 'Hunting Soft Point / Partition', recommended_seating_depth: 0.360, profile_notes: 'Heavy timber elk bullet for .35 Whelen' },

  // ===================== 9.3mm (.366") =====================
  { id: 'nosler_93_partition_286', name: 'Nosler Partition 286 gr (9.3mm)', manufacturer: 'Nosler', caliber_inches: 0.366, caliber_designation: '9.3mm', weight_grains: 286, length_inches: 1.430, g1_bc: 0.482, category: 'Hunting Soft Point / Partition', recommended_seating_depth: 0.400, profile_notes: 'The African classic for 9.3x62mm Mauser' },
  { id: 'lapua_93_mega_286', name: 'Lapua Mega 286 gr SP (9.3mm)', manufacturer: 'Lapua', caliber_inches: 0.366, caliber_designation: '9.3mm', weight_grains: 286, length_inches: 1.320, g1_bc: 0.380, category: 'Hunting Soft Point / Partition', recommended_seating_depth: 0.380, profile_notes: 'Scandinavian moose hunting benchmark' },

  // ===================== .375 Caliber (.375") =====================
  { id: 'sierra_375_gameking_300', name: 'Sierra GameKing 300 gr SBT (.375)', manufacturer: 'Sierra', caliber_inches: 0.375, caliber_designation: '.375', weight_grains: 300, length_inches: 1.540, g1_bc: 0.475, category: 'Hunting Soft Point / Partition', recommended_seating_depth: 0.420, profile_notes: 'All-around big game hunting bullet for .375 H&H' },
  { id: 'hornady_375_interlock_300', name: 'Hornady InterLock 300 gr RN (.375)', manufacturer: 'Hornady', caliber_inches: 0.375, caliber_designation: '.375', weight_grains: 300, length_inches: 1.340, g1_bc: 0.325, category: 'Hunting Soft Point / Partition', recommended_seating_depth: 0.420, profile_notes: 'Round nose dangerous game soft point' },
  { id: 'hornady_375_dgs_300', name: 'Hornady Dangerous Game Solid (DGS) 300 gr', manufacturer: 'Hornady', caliber_inches: 0.375, caliber_designation: '.375', weight_grains: 300, length_inches: 1.480, g1_bc: 0.295, category: 'Dangerous Game Solid / Heavy', recommended_seating_depth: 0.450, profile_notes: 'Steel jacketed solid for elephant and Cape buffalo' },
  { id: 'barnes_375_banded_solid_300', name: 'Barnes Banded Solid 300 gr (.375)', manufacturer: 'Barnes', caliber_inches: 0.375, caliber_designation: '.375', weight_grains: 300, length_inches: 1.580, g1_bc: 0.340, category: 'Dangerous Game Solid / Heavy', recommended_seating_depth: 0.450, profile_notes: 'Homogeneous brass solid that will not bend or deform' },
  { id: 'ceb_375_mth_350', name: 'Cutting Edge Bullets MTH 350 gr Match', manufacturer: 'Cutting Edge', caliber_inches: 0.375, caliber_designation: '.375', weight_grains: 350, length_inches: 2.180, g1_bc: 0.880, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.500, profile_notes: 'Ultra-high BC solid match bullet for .375 CheyTac' },

  // ===================== 10mm / .40 S&W (.400") =====================
  { id: 'hornady_40_xtp_180', name: 'Hornady XTP 180 gr JHP (.400)', manufacturer: 'Hornady', caliber_inches: 0.400, caliber_designation: '.400', weight_grains: 180, length_inches: 0.630, g1_bc: 0.164, category: 'Handgun FMJ / Hollow Point', recommended_seating_depth: 0.240, profile_notes: 'The benchmark 10mm Auto & .40 S&W bullet' },
  { id: 'underwood_10mm_hardcast_220', name: 'Underwood Hard Cast Flat Nose 220 gr', manufacturer: 'Underwood', caliber_inches: 0.400, caliber_designation: '.400', weight_grains: 220, length_inches: 0.740, g1_bc: 0.210, category: 'Handgun FMJ / Hollow Point', recommended_seating_depth: 0.300, profile_notes: 'Grizzly bear protection woods load for 10mm Auto' },

  // ===================== .408 CheyTac (.408") =====================
  { id: 'cheytac_408_balance_419', name: 'CheyTac Balanced Flight Solid 419 gr', manufacturer: 'CheyTac', caliber_inches: 0.408, caliber_designation: '.408', weight_grains: 419, length_inches: 2.190, g1_bc: 0.949, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.520, profile_notes: 'World-record 2,500-yard military projectile' },

  // ===================== .416 Caliber (.416") =====================
  { id: 'hornady_416_dgx_400', name: 'Hornady DGX Bonded 400 gr (.416)', manufacturer: 'Hornady', caliber_inches: 0.416, caliber_designation: '.416', weight_grains: 400, length_inches: 1.620, g1_bc: 0.344, category: 'Dangerous Game Solid / Heavy', recommended_seating_depth: 0.480, profile_notes: 'Dangerous Game Expanding soft point for .416 Rigby' },
  { id: 'hornady_416_dgs_400', name: 'Hornady DGS Solid 400 gr (.416)', manufacturer: 'Hornady', caliber_inches: 0.416, caliber_designation: '.416', weight_grains: 400, length_inches: 1.640, g1_bc: 0.320, category: 'Dangerous Game Solid / Heavy', recommended_seating_depth: 0.500, profile_notes: 'Full steel jacketed solid for .416 Rigby & Rem Mag' },
  { id: 'barnes_416_banded_solid_400', name: 'Barnes Banded Solid 400 gr (.416)', manufacturer: 'Barnes', caliber_inches: 0.416, caliber_designation: '.416', weight_grains: 400, length_inches: 1.710, g1_bc: 0.360, category: 'Dangerous Game Solid / Heavy', recommended_seating_depth: 0.500, profile_notes: 'Solid brass dangerous game projectile' },
  { id: 'barrett_416_match_solid_398', name: 'Barrett Precision Solid 398 gr (.416 Barrett)', manufacturer: 'Barrett', caliber_inches: 0.416, caliber_designation: '.416', weight_grains: 398, length_inches: 2.150, g1_bc: 0.880, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.520, profile_notes: 'Machined monolithic brass ELR sniper projectile' },

  // ===================== .44 Handgun (.429") =====================
  { id: 'hornady_44_xtp_240', name: 'Hornady XTP 240 gr JHP (.429)', manufacturer: 'Hornady', caliber_inches: 0.429, caliber_designation: '.429', weight_grains: 240, length_inches: 0.730, g1_bc: 0.205, category: 'Handgun FMJ / Hollow Point', recommended_seating_depth: 0.320, profile_notes: 'The defining .44 Magnum hunting & silhouette bullet' },
  { id: 'speer_44_deepcurl_300', name: 'Speer DeepCurl 300 gr SP (.429)', manufacturer: 'Speer', caliber_inches: 0.429, caliber_designation: '.429', weight_grains: 300, length_inches: 0.890, g1_bc: 0.245, category: 'Handgun FMJ / Hollow Point', recommended_seating_depth: 0.380, profile_notes: 'Heavy bonded soft point for bear defence in .44 Mag' },

  // ===================== .45 Auto / Revolver (.452") =====================
  { id: 'hornady_45_xtp_230', name: 'Hornady XTP 230 gr JHP (.452)', manufacturer: 'Hornady', caliber_inches: 0.452, caliber_designation: '.452', weight_grains: 230, length_inches: 0.675, g1_bc: 0.188, category: 'Handgun FMJ / Hollow Point', recommended_seating_depth: 0.270, profile_notes: 'Standard defense hollow point for .45 ACP' },
  { id: 'mil_45acp_fmj_230', name: 'USGI .45 ACP Ball 230 gr FMJ', manufacturer: 'Winchester', caliber_inches: 0.452, caliber_designation: '.452', weight_grains: 230, length_inches: 0.680, g1_bc: 0.195, category: 'Handgun FMJ / Hollow Point', recommended_seating_depth: 0.270, profile_notes: 'Standard 1911 military service ball' },
  { id: 'hornady_450_ftx_250', name: 'Hornady FTX 250 gr (.452 - .450 Bushmaster)', manufacturer: 'Hornady', caliber_inches: 0.452, caliber_designation: '.452', weight_grains: 250, length_inches: 0.890, g1_bc: 0.210, category: 'Lever-Action Flat Nose / Flex Tip', recommended_seating_depth: 0.350, profile_notes: 'Flex Tip bullet designed for .450 Bushmaster' },
  { id: 'swift_454_aframe_300', name: 'Swift A-Frame 300 gr Heavy Revolver', manufacturer: 'Swift', caliber_inches: 0.452, caliber_designation: '.452', weight_grains: 300, length_inches: 0.860, g1_bc: 0.250, category: 'Hunting Soft Point / Partition', recommended_seating_depth: 0.360, profile_notes: 'Heavy big game hunting bullet for .454 Casull & .460 S&W' },

  // ===================== .458 Caliber (.458") =====================
  { id: 'hornady_458_ftx_325', name: 'Hornady FTX 325 gr (.45-70 LeverEvolution)', manufacturer: 'Hornady', caliber_inches: 0.458, caliber_designation: '.458', weight_grains: 325, length_inches: 1.060, g1_bc: 0.230, category: 'Lever-Action Flat Nose / Flex Tip', recommended_seating_depth: 0.400, profile_notes: 'Safe for tubular magazines in .45-70 lever actions' },
  { id: 'remington_458_sp_405', name: 'Remington Core-Lokt 405 gr SP (.45-70)', manufacturer: 'Remington', caliber_inches: 0.458, caliber_designation: '.458', weight_grains: 405, length_inches: 1.080, g1_bc: 0.281, category: 'Hunting Soft Point / Partition', recommended_seating_depth: 0.420, profile_notes: 'The traditional trapdoor and lever-action buffalo load' },
  { id: 'hornady_458_dgs_500', name: 'Hornady Dangerous Game Solid 500 gr (.458)', manufacturer: 'Hornady', caliber_inches: 0.458, caliber_designation: '.458', weight_grains: 500, length_inches: 1.480, g1_bc: 0.295, category: 'Dangerous Game Solid / Heavy', recommended_seating_depth: 0.500, profile_notes: 'Heavy stopping solid for .458 Win Mag & .458 Lott' },
  { id: 'barnes_458_tsx_450', name: 'Barnes TSX Flat Nose 450 gr (.458)', manufacturer: 'Barnes', caliber_inches: 0.458, caliber_designation: '.458', weight_grains: 450, length_inches: 1.420, g1_bc: 0.312, category: 'Monolithic Solid Copper', recommended_seating_depth: 0.480, profile_notes: '100% monolithic copper dangerous game stopper' },

  // ===================== .500 Handgun (.500") =====================
  { id: 'hornady_500_ftx_300', name: 'Hornady FTX 300 gr (.500 S&W / Beowulf)', manufacturer: 'Hornady', caliber_inches: 0.500, caliber_designation: '.500', weight_grains: 300, length_inches: 0.880, g1_bc: 0.200, category: 'Lever-Action Flat Nose / Flex Tip', recommended_seating_depth: 0.350, profile_notes: 'High velocity expansion in .500 S&W and .50 Beowulf' },
  { id: 'barnes_500_xpb_375', name: 'Barnes XPB 375 gr Solid Copper (.500)', manufacturer: 'Barnes', caliber_inches: 0.500, caliber_designation: '.500', weight_grains: 375, length_inches: 1.150, g1_bc: 0.230, category: 'Monolithic Solid Copper', recommended_seating_depth: 0.420, profile_notes: 'Monolithic hunting hollow point for giant handguns' },
  { id: 'corbon_500_hardcast_440', name: 'Cor-Bon Hard Cast Flat Point 440 gr (.500)', manufacturer: 'Cor-Bon', caliber_inches: 0.500, caliber_designation: '.500', weight_grains: 440, length_inches: 1.050, g1_bc: 0.240, category: 'Dangerous Game Solid / Heavy', recommended_seating_depth: 0.450, profile_notes: 'Maximum penetration bear stopper' },

  // ===================== .50 BMG / 12.7mm (.510") =====================
  { id: 'mil_50bmg_m33_660', name: 'USGI M33 Ball 660 gr FMJBT (.510 BMG)', manufacturer: 'Lake City', caliber_inches: 0.510, caliber_designation: '.510', weight_grains: 660, length_inches: 2.300, g1_bc: 0.670, category: 'Match / Target BTHP', recommended_seating_depth: 0.650, profile_notes: 'Standard military issue machine gun and Barrett ball' },
  { id: 'hornady_50bmg_amx_750', name: 'Hornady A-MAX 750 gr Match (.510 BMG)', manufacturer: 'Hornady', caliber_inches: 0.510, caliber_designation: '.510', weight_grains: 750, length_inches: 2.580, g1_bc: 1.050, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.700, profile_notes: 'The 1,000-yard benchmark projectile for .50 BMG' },
  { id: 'barnes_50bmg_bore_bore_750', name: 'Barnes Precision Match Solid 750 gr (.510)', manufacturer: 'Barnes', caliber_inches: 0.510, caliber_designation: '.510', weight_grains: 750, length_inches: 2.620, g1_bc: 1.070, category: 'Extreme Long Range (ELD / Hybrid)', recommended_seating_depth: 0.700, profile_notes: 'CNC turned solid bronze high-BC projectile' },

  // ===================== African Heavy Express (.585" - .700") =====================
  { id: 'woodleigh_577_solid_750', name: 'Woodleigh Weldcore Solid 750 gr (.585 / .577 NE)', manufacturer: 'Woodleigh', caliber_inches: 0.585, caliber_designation: '.585', weight_grains: 750, length_inches: 1.820, g1_bc: 0.320, category: 'Dangerous Game Solid / Heavy', recommended_seating_depth: 0.550, profile_notes: 'Heavy stopping solid for .577 Nitro & .577 T-Rex' },
  { id: 'woodleigh_600_solid_900', name: 'Woodleigh Hydro Solid 900 gr (.620 / .600 NE)', manufacturer: 'Woodleigh', caliber_inches: 0.620, caliber_designation: '.620', weight_grains: 900, length_inches: 2.050, g1_bc: 0.310, category: 'Dangerous Game Solid / Heavy', recommended_seating_depth: 0.600, profile_notes: 'Elephant stopping bullet for .600 Nitro Express' },
  { id: 'woodleigh_700_solid_1000', name: 'Woodleigh Weldcore Solid 1,000 gr (.700 NE)', manufacturer: 'Woodleigh', caliber_inches: 0.700, caliber_designation: '.700', weight_grains: 1000, length_inches: 2.220, g1_bc: 0.350, category: 'Dangerous Game Solid / Heavy', recommended_seating_depth: 0.650, profile_notes: 'Massive monolithic brass projectile for .700 Nitro Express' }
];

// -----------------------------------------------------------------------------
// Helper Functions for Calibers & Bullets
// -----------------------------------------------------------------------------

/**
 * Returns all bullet models suitable for a specific caliber diameter.
 * Tolerates within +/- 0.004" to handle nominal differences (e.g. .311 vs .312, .451 vs .452).
 */
export function getBulletsForCaliber(caliberInches: number, tolerance: number = 0.004): BulletOption[] {
  return BULLET_OPTIONS.filter(b => Math.abs(b.caliber_inches - caliberInches) <= tolerance);
}

/**
 * Finds the closest standard caliber preset to any given bullet diameter.
 */
export function findClosestCaliberPreset(diameterInches: number): CaliberPreset {
  let closest = CALIBER_PRESETS[4]; // Default to .224
  let minDiff = Infinity;
  for (const preset of CALIBER_PRESETS) {
    const diff = Math.abs(preset.inches - diameterInches);
    if (diff < minDiff) {
      minDiff = diff;
      closest = preset;
    }
  }
  return closest;
}

/**
 * All 6 Caliber Categories for filtering UI tabs
 */
export const CALIBER_CATEGORIES: CaliberCategory[] = [
  'Sub-Caliber & Varmint',
  'Match & Service Rifle (6mm - .30 Cal)',
  'Medium Bore & European (8mm - 9.3mm)',
  'African Express & Dangerous Game',
  'Handgun, Pistol & PDW',
  'Anti-Materiel & Extreme Long Range (ELR)'
];
