// Template processors for timecyc, colorcyc, weapon
import { TCYC_TEMPLATE, CC_TEMPLATE, WEAPON_TEMPLATE, CONFIG_TEMPLATE, TEXDB_TEMPLATE } from '@/src/data/templates';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace(/^#/, '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

// Timecyc: 4 colors — top (skyBottom), bottom (skyTop), sun, cloud
// Placeholders: skbr/skbg/skbb (sky bottom = top of sky color)
//               sktr/sktg/sktb (sky top = horizon)
//               scr/scg/scb (sun)
//               clr/clg/clb (cloud)
export function generateTimecyc(
  topHex: string,    // sky top color
  bottomHex: string, // sky bottom/horizon
  sunHex: string,    // sun color
  cloudHex: string   // cloud color
): string {
  const [skbr, skbg, skbb] = hexToRgb(topHex);
  const [sktr, sktg, sktb] = hexToRgb(bottomHex);
  const [scr, scg, scb] = hexToRgb(sunHex);
  const [clr, clg, clb] = hexToRgb(cloudHex);

  let result = TCYC_TEMPLATE;
  result = result.replaceAll('skbr', String(skbr));
  result = result.replaceAll('skbg', String(skbg));
  result = result.replaceAll('skbb', String(skbb));
  result = result.replaceAll('sktr', String(sktr));
  result = result.replaceAll('sktg', String(sktg));
  result = result.replaceAll('sktb', String(sktb));
  result = result.replaceAll('scr', String(scr));
  result = result.replaceAll('scg', String(scg));
  result = result.replaceAll('scb', String(scb));
  result = result.replaceAll('clr', String(clr));
  result = result.replaceAll('clg', String(clg));
  result = result.replaceAll('clb', String(clb));
  return result;
}

// Colorcyc: 1 color → colorcycle.dat
// Values are divided by 100 (hex FF = 2.55)
export function generateColorcyc(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const rv = (r / 100).toFixed(3);
  const gv = (g / 100).toFixed(3);
  const bv = (b / 100).toFixed(3);

  let result = CC_TEMPLATE;
  result = result.replaceAll('r', rv);
  result = result.replaceAll('g', gv);
  result = result.replaceAll('b', bv);
  return result;
}

// Weapon: 2 params → weapon.dat
// ПТ = float (penalty time), RAZB = int (разброс)
export function generateWeapon(pt: string, razb: string): string {
  let result = WEAPON_TEMPLATE;
  result = result.replaceAll('ПТ', pt);
  result = result.replaceAll('RAZB', razb);
  return result;
}

// Osnova: treepsize → config.dat + texdb.dat
export function generateOsnovaConfig(treepsize: string): string {
  return CONFIG_TEMPLATE.replaceAll('treepsize', treepsize);
}

export function generateOsnovaTexdb(treepsize: string): string {
  return TEXDB_TEMPLATE.replaceAll('treepsize', treepsize);
}
