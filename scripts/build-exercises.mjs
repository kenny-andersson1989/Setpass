// Bygger public/data/exercises.json från free-exercise-db (Unlicense / public domain).
// Användning: node scripts/build-exercises.mjs [lokal-fil.json]
import { readFile, writeFile } from 'node:fs/promises';

const SRC = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const local = process.argv[2];
const raw = local ? JSON.parse(await readFile(local, 'utf8')) : await (await fetch(SRC)).json();

const out = raw.map((e) => ({
  id: e.id,
  name: e.name,
  category: e.category,
  equipment: e.equipment ?? 'other',
  level: e.level,
  force: e.force ?? undefined,
  mechanic: e.mechanic ?? undefined,
  primaryMuscles: e.primaryMuscles,
  secondaryMuscles: e.secondaryMuscles,
  instructions: e.instructions,
  images: e.images
}));
await writeFile('public/data/exercises.json', JSON.stringify(out));
console.log(`Skrev ${out.length} övningar`);
