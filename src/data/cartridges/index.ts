import { CartridgeSpec } from '../../types/cartridge';
import { MILITARY_CARTRIDGES } from './military';
import { PRECISION_MATCH_CARTRIDGES } from './precisionMatch';
import { TACTICAL_AR_CARTRIDGES } from './tacticalAr';
import { HUNTING_CARTRIDGES } from './hunting';
import { MAGNUMS_ELR_CARTRIDGES } from './magnumsElr';
import { DANGEROUS_GAME_CARTRIDGES } from './dangerousGame';
import { STRAIGHT_WALL_LEVER_CARTRIDGES } from './straightWallLever';
import { HANDGUN_PISTOL_CARTRIDGES } from './handgunPistol';
import { WILDCATS_ACKLEY_CARTRIDGES } from './wildcatsAckley';
import { RIMFIRE_CARTRIDGES } from './rimfire';
import { CLASSIFIED_CARTRIDGES } from './classified';

export const CARTRIDGE_PRESETS: Record<string, CartridgeSpec> = {
  ...MILITARY_CARTRIDGES,
  ...PRECISION_MATCH_CARTRIDGES,
  ...TACTICAL_AR_CARTRIDGES,
  ...HUNTING_CARTRIDGES,
  ...MAGNUMS_ELR_CARTRIDGES,
  ...DANGEROUS_GAME_CARTRIDGES,
  ...STRAIGHT_WALL_LEVER_CARTRIDGES,
  ...HANDGUN_PISTOL_CARTRIDGES,
  ...WILDCATS_ACKLEY_CARTRIDGES,
  ...RIMFIRE_CARTRIDGES,
  ...CLASSIFIED_CARTRIDGES,
};

export const DEFAULT_CARTRIDGE_ID = '308_win';
