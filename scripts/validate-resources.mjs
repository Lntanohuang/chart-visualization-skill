#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mappingPath = resolve(skillRoot, 'resources/administrative-codes/guangdong-city-codes.json');

const fail = (message) => {
  throw new Error(message);
};

const loadJson = async (path, label) => {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
};

const mapping = await loadJson(mappingPath, 'city code mapping');
if (mapping.schemaVersion !== 1) fail('city code mapping: schemaVersion must be 1');
if (mapping.scope?.province !== '广东省' || mapping.scope?.provinceCode !== '440000') {
  fail('city code mapping: expected Guangdong scope 440000');
}
if (mapping.scope?.level !== 'city') fail('city code mapping: level must be city');
if (!Array.isArray(mapping.cities) || mapping.cities.length === 0) {
  fail('city code mapping: cities must be a non-empty array');
}
if (!mapping.cityNameToCode || typeof mapping.cityNameToCode !== 'object') {
  fail('city code mapping: cityNameToCode must be an object');
}

const canonicalCodes = new Set();
const namesByCode = new Map();
const namesSeen = new Map();
for (const city of mapping.cities) {
  if (!city || typeof city !== 'object') fail('city code mapping: every city must be an object');
  const code = String(city.code ?? '');
  const name = String(city.name ?? '');
  if (!/^\d{6}$/.test(code)) fail(`city code mapping: invalid code ${code}`);
  if (canonicalCodes.has(code)) fail(`city code mapping: duplicate code ${code}`);
  if (!name) fail(`city code mapping: empty name for ${code}`);
  canonicalCodes.add(code);
  namesByCode.set(code, name);

  const aliases = city.aliases ?? [];
  if (!Array.isArray(aliases)) fail(`city code mapping: aliases for ${code} must be an array`);
  for (const alias of [name, ...aliases]) {
    if (typeof alias !== 'string' || !alias.trim()) fail(`city code mapping: empty alias for ${code}`);
    const previous = namesSeen.get(alias);
    if (previous && previous !== code) fail(`city code mapping: ambiguous name ${alias} maps to ${previous} and ${code}`);
    namesSeen.set(alias, code);
  }
}

for (const [name, codeValue] of Object.entries(mapping.cityNameToCode)) {
  const code = String(codeValue);
  if (!canonicalCodes.has(code)) fail(`cityNameToCode: ${name} points to unknown code ${code}`);
  if (namesSeen.get(name) !== code) fail(`cityNameToCode: ${name} is missing from the city aliases for ${code}`);
}
for (const [name, code] of namesSeen) {
  if (String(mapping.cityNameToCode[name]) !== code) {
    fail(`cityNameToCode: missing mapping for ${name}`);
  }
}

const boundaryPath = resolve(dirname(mappingPath), mapping.boundaryResource);
const boundaries = await loadJson(boundaryPath, 'Guangdong boundary resource');
if (boundaries.type !== 'FeatureCollection' || !Array.isArray(boundaries.features)) {
  fail('Guangdong boundary resource: expected a GeoJSON FeatureCollection');
}
if (boundaries.features.length !== canonicalCodes.size) {
  fail(`Guangdong boundary resource: ${boundaries.features.length} features for ${canonicalCodes.size} mapped cities`);
}
const featureCodes = new Set();
for (const feature of boundaries.features) {
  const properties = feature?.properties ?? {};
  const code = String(properties.adcode ?? '');
  const name = String(properties.name ?? '');
  if (!/^\d{6}$/.test(code)) fail(`boundary resource: invalid properties.adcode ${code}`);
  if (featureCodes.has(code)) fail(`boundary resource: duplicate properties.adcode ${code}`);
  if (!canonicalCodes.has(code)) fail(`boundary resource: code ${code} is absent from city code mapping`);
  if (namesByCode.get(code) !== name) {
    fail(`boundary resource: ${code} name ${name} does not match ${namesByCode.get(code)}`);
  }
  if (properties.level !== 'city') fail(`boundary resource: ${code} must have level=city`);
  if (String(properties.parent?.adcode ?? '') !== '440000') {
    fail(`boundary resource: ${code} must have parent.adcode=440000`);
  }
  if (!['MultiPolygon', 'Polygon'].includes(feature.geometry?.type)) {
    fail(`boundary resource: ${code} must use Polygon or MultiPolygon geometry`);
  }
  featureCodes.add(code);
}
for (const code of canonicalCodes) {
  if (!featureCodes.has(code)) fail(`boundary resource: missing feature for ${code}`);
}

console.log(`OK: ${canonicalCodes.size} Guangdong city codes, ${featureCodes.size} matching offline boundaries, ${Object.keys(mapping.cityNameToCode).length} name aliases`);
console.log(`Boundary: ${boundaryPath}`);
