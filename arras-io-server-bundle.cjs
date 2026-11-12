var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_http = __toESM(require("http"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_express = __toESM(require("express"), 1);
var import_ws2 = require("ws");

// server/room.ts
var import_ws = require("ws");

// shared/tanks.ts
var LEVEL_EXP_TABLE = [
  0,
  // Lv 1
  5,
  // Lv 2
  12,
  // Lv 3
  22,
  // Lv 4
  35,
  // Lv 5
  50,
  // Lv 6
  70,
  // Lv 7
  95,
  // Lv 8
  125,
  // Lv 9
  160,
  // Lv 10
  200,
  // Lv 11
  250,
  // Lv 12
  310,
  // Lv 13
  380,
  // Lv 14
  460,
  // Lv 15 -> Tier 2 (Reach in ~2 squares or 1 triangle!)
  560,
  // Lv 16
  680,
  // Lv 17
  820,
  // Lv 18
  980,
  // Lv 19
  1160,
  // Lv 20
  1360,
  // Lv 21
  1580,
  // Lv 22
  1820,
  // Lv 23
  2080,
  // Lv 24
  2360,
  // Lv 25
  2660,
  // Lv 26
  2980,
  // Lv 27
  3320,
  // Lv 28
  3680,
  // Lv 29
  4100,
  // Lv 30 -> Tier 3 (Reach in ~4 pentagons!)
  4600,
  // Lv 31
  5200,
  // Lv 32
  5900,
  // Lv 33
  6700,
  // Lv 34
  7600,
  // Lv 35
  8600,
  // Lv 36
  9700,
  // Lv 37
  10900,
  // Lv 38
  12200,
  // Lv 39
  13600,
  // Lv 40
  15100,
  // Lv 41
  16700,
  // Lv 42
  18400,
  // Lv 43
  20200,
  // Lv 44
  22500
  // Lv 45 -> Tier 4 (Fast max level, instant action!)
];
function getLevelFromExp(exp) {
  for (let i = LEVEL_EXP_TABLE.length - 1; i >= 0; i--) {
    if (exp >= LEVEL_EXP_TABLE[i]) {
      return i + 1;
    }
  }
  return 1;
}
var TANKS = {
  // === TIER 1 ===
  basic: {
    id: "basic",
    name: "Basic Tank",
    tier: 1,
    upgradesTo: ["twin", "sniper", "machine_gun", "flank_guard", "pounder", "director", "trapper", "smasher", "auto_3"],
    description: "The standard multi-purpose tank with balanced speed, firepower, and defense.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 42, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1, recoil: 3.5, bulletSpeed: 10, bulletDamage: 14, bulletHealth: 15, bulletSize: 9, bulletLife: 2.5, spread: 0.04, type: "bullet" }
    ]
  },
  // === TIER 2 ===
  twin: {
    id: "twin",
    name: "Twin",
    tier: 2,
    upgradesFrom: "basic",
    upgradesTo: ["triplet_shot", "double_twin"],
    description: "Fires two streams of bullets in alternating succession.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 42, width: 16, angleOffset: 0, offsetX: 0, offsetY: -10, reloadMultiplier: 1, recoil: 2.8, bulletSpeed: 10, bulletDamage: 11, bulletHealth: 13, bulletSize: 8, bulletLife: 2.5, spread: 0.05, delay: 0, type: "bullet" },
      { length: 42, width: 16, angleOffset: 0, offsetX: 0, offsetY: 10, reloadMultiplier: 1, recoil: 2.8, bulletSpeed: 10, bulletDamage: 11, bulletHealth: 13, bulletSize: 8, bulletLife: 2.5, spread: 0.05, delay: 0.5, type: "bullet" }
    ]
  },
  sniper: {
    id: "sniper",
    name: "Sniper",
    tier: 2,
    upgradesFrom: "basic",
    upgradesTo: ["assassin", "hunter", "overseer", "rifle"],
    description: "High velocity and heavy penetration bullets with extended visual range.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.25,
    barrels: [
      { length: 55, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.6, recoil: 5.5, bulletSpeed: 15, bulletDamage: 26, bulletHealth: 24, bulletSize: 9.5, bulletLife: 3, spread: 0.02, type: "bullet" }
    ]
  },
  machine_gun: {
    id: "machine_gun",
    name: "Machine Gun",
    tier: 2,
    upgradesFrom: "basic",
    upgradesTo: ["destroyer", "gunner", "sprayer", "gatling"],
    description: "Blasts out a rapid storm of bullets with widened cone of fire.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 40, width: 26, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.52, recoil: 2.2, bulletSpeed: 9.5, bulletDamage: 9, bulletHealth: 11, bulletSize: 8.5, bulletLife: 2.2, spread: 0.22, type: "bullet" }
    ]
  },
  flank_guard: {
    id: "flank_guard",
    name: "Flank Guard",
    tier: 2,
    upgradesFrom: "basic",
    upgradesTo: ["tri_angle", "quad_tank", "auto_3"],
    description: "Fires forward and backward simultaneously to repel flankers.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 42, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1, recoil: 3.2, bulletSpeed: 10, bulletDamage: 13, bulletHealth: 15, bulletSize: 9, bulletLife: 2.5, spread: 0.04, type: "bullet" },
      { length: 34, width: 18, angleOffset: Math.PI, offsetX: 0, offsetY: 0, reloadMultiplier: 1, recoil: 3.2, bulletSpeed: 10, bulletDamage: 12, bulletHealth: 13, bulletSize: 8.5, bulletLife: 2.5, spread: 0.04, type: "bullet" }
    ]
  },
  pounder: {
    id: "pounder",
    name: "Pounder",
    tier: 2,
    upgradesFrom: "basic",
    upgradesTo: ["destroyer", "builder", "skimmer"],
    description: "Fires massive, heavy-impact cannonballs that tear through shapes and tanks.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 42, width: 28, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.5, recoil: 7, bulletSpeed: 9.2, bulletDamage: 32, bulletHealth: 36, bulletSize: 15, bulletLife: 2.6, spread: 0.04, type: "bullet" }
    ]
  },
  director: {
    id: "director",
    name: "Director",
    tier: 2,
    upgradesFrom: "basic",
    upgradesTo: ["overseer", "cruiser", "underseer"],
    description: "Commands a squad of guided attack drones that swarm towards your crosshair.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.15,
    maxDrones: 4,
    droneType: "minion",
    barrels: [
      { length: 38, width: 28, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 2, recoil: 1, bulletSpeed: 7, bulletDamage: 22, bulletHealth: 25, bulletSize: 11, bulletLife: 15, spread: 0.05, type: "drone" }
    ]
  },
  trapper: {
    id: "trapper",
    name: "Trapper",
    tier: 2,
    upgradesFrom: "basic",
    upgradesTo: ["tri_trapper", "mega_trapper", "builder"],
    description: "Lays stationary triangular spike traps that form a defensive fortress perimeter.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    maxTraps: 8,
    barrels: [
      { length: 38, width: 24, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.3, recoil: 3.5, bulletSpeed: 8.5, bulletDamage: 28, bulletHealth: 40, bulletSize: 12, bulletLife: 12, spread: 0.06, type: "trap" }
    ]
  },
  smasher: {
    id: "smasher",
    name: "Smasher",
    tier: 2,
    upgradesFrom: "basic",
    upgradesTo: ["mega_smasher", "landmine", "spike"],
    description: "Armored ramming hull with reinforced body damage and knockback resistance. No guns.",
    bodyShape: "hexagon",
    bodyRadius: 26,
    fovMultiplier: 1,
    isRammer: true,
    barrels: []
  },
  auto_3: {
    id: "auto_3",
    name: "Auto-3",
    tier: 2,
    upgradesFrom: "basic",
    upgradesTo: ["auto_4", "auto_5"],
    description: "Equipped with 3 automated rotating turrets that independently lock onto enemies.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.05,
    barrels: [],
    autoTurrets: [
      { radius: 10, offsetDist: 14, angleOffset: 0, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1, recoil: 1.5, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: "bullet" }] },
      { radius: 10, offsetDist: 14, angleOffset: 2 * Math.PI / 3, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1, recoil: 1.5, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: "bullet" }] },
      { radius: 10, offsetDist: 14, angleOffset: 4 * Math.PI / 3, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1, recoil: 1.5, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: "bullet" }] }
    ]
  },
  // === TIER 3 ===
  triplet_shot: {
    id: "triplet_shot",
    name: "Triple Shot",
    tier: 3,
    upgradesFrom: "twin",
    upgradesTo: ["triplet", "penta_shot"],
    description: "Three forward barrels covering a wider attack arc.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 42, width: 16, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0, type: "bullet" },
      { length: 36, width: 16, angleOffset: -0.32, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.33, type: "bullet" },
      { length: 36, width: 16, angleOffset: 0.32, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.66, type: "bullet" }
    ]
  },
  double_twin: {
    id: "double_twin",
    name: "Double Twin",
    tier: 3,
    upgradesFrom: "twin",
    upgradesTo: ["triple_twin"],
    description: "Twin cannons on both front and rear for bi-directional suppression.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 42, width: 15, angleOffset: 0, offsetX: 0, offsetY: -9, reloadMultiplier: 0.95, recoil: 2.5, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 12, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0, type: "bullet" },
      { length: 42, width: 15, angleOffset: 0, offsetX: 0, offsetY: 9, reloadMultiplier: 0.95, recoil: 2.5, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 12, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.5, type: "bullet" },
      { length: 42, width: 15, angleOffset: Math.PI, offsetX: 0, offsetY: -9, reloadMultiplier: 0.95, recoil: 2.5, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 12, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.25, type: "bullet" },
      { length: 42, width: 15, angleOffset: Math.PI, offsetX: 0, offsetY: 9, reloadMultiplier: 0.95, recoil: 2.5, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 12, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.75, type: "bullet" }
    ]
  },
  assassin: {
    id: "assassin",
    name: "Assassin",
    tier: 3,
    upgradesFrom: "sniper",
    upgradesTo: ["ranger", "stalker"],
    description: "Super long barrel and massive zoom for long distance sniping.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.45,
    barrels: [
      { length: 65, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.8, recoil: 6.5, bulletSpeed: 17, bulletDamage: 32, bulletHealth: 28, bulletSize: 10, bulletLife: 3.5, spread: 0.015, type: "bullet" }
    ]
  },
  hunter: {
    id: "hunter",
    name: "Hunter",
    tier: 3,
    upgradesFrom: "sniper",
    upgradesTo: ["streamliner", "nailgun"],
    description: "Two concentric barrels firing a high damage two-round heavy shell burst.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.25,
    barrels: [
      { length: 48, width: 22, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.4, recoil: 4.5, bulletSpeed: 13, bulletDamage: 22, bulletHealth: 20, bulletSize: 11, bulletLife: 2.8, spread: 0.03, delay: 0, type: "bullet" },
      { length: 58, width: 16, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.4, recoil: 4.5, bulletSpeed: 15, bulletDamage: 17, bulletHealth: 16, bulletSize: 8, bulletLife: 3, spread: 0.02, delay: 0.25, type: "bullet" }
    ]
  },
  rifle: {
    id: "rifle",
    name: "Rifle",
    tier: 3,
    upgradesFrom: "sniper",
    upgradesTo: ["streamliner", "ranger"],
    description: "Precision battle rifle with higher fire rate than standard sniper.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.35,
    barrels: [
      { length: 58, width: 16, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.1, recoil: 4, bulletSpeed: 16, bulletDamage: 24, bulletHealth: 22, bulletSize: 9, bulletLife: 3.2, spread: 0.02, type: "bullet" }
    ]
  },
  destroyer: {
    id: "destroyer",
    name: "Destroyer",
    tier: 3,
    upgradesFrom: "pounder",
    upgradesTo: ["annihilator", "hybrid", "rocketeer"],
    description: "Gigantic cannon launching devastating heavy cannonballs with extreme recoil.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 44, width: 34, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 2, recoil: 12, bulletSpeed: 9, bulletDamage: 55, bulletHealth: 55, bulletSize: 20, bulletLife: 2.8, spread: 0.03, type: "bullet" }
    ]
  },
  gunner: {
    id: "gunner",
    name: "Gunner",
    tier: 3,
    upgradesFrom: "machine_gun",
    upgradesTo: ["auto_gunner", "streamliner", "gatling"],
    description: "Four micro-barrels peppering targets with a blazing stream of needle bullets.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 38, width: 9, angleOffset: 0, offsetX: 0, offsetY: -12, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 7, bulletHealth: 9, bulletSize: 5.5, bulletLife: 2.2, spread: 0.07, delay: 0, type: "bullet" },
      { length: 38, width: 9, angleOffset: 0, offsetX: 0, offsetY: -4, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 7, bulletHealth: 9, bulletSize: 5.5, bulletLife: 2.2, spread: 0.07, delay: 0.5, type: "bullet" },
      { length: 38, width: 9, angleOffset: 0, offsetX: 0, offsetY: 4, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 7, bulletHealth: 9, bulletSize: 5.5, bulletLife: 2.2, spread: 0.07, delay: 0.25, type: "bullet" },
      { length: 38, width: 9, angleOffset: 0, offsetX: 0, offsetY: 12, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 7, bulletHealth: 9, bulletSize: 5.5, bulletLife: 2.2, spread: 0.07, delay: 0.75, type: "bullet" }
    ]
  },
  sprayer: {
    id: "sprayer",
    name: "Sprayer",
    tier: 3,
    upgradesFrom: "machine_gun",
    upgradesTo: ["triplet", "gatling"],
    description: "A hybrid machine gun with an outer cone and focused central cannon.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 38, width: 30, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.45, recoil: 1.8, bulletSpeed: 10, bulletDamage: 8, bulletHealth: 10, bulletSize: 7.5, bulletLife: 2.2, spread: 0.24, delay: 0, type: "bullet" },
      { length: 46, width: 16, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.45, recoil: 2.4, bulletSpeed: 12, bulletDamage: 11, bulletHealth: 13, bulletSize: 8.5, bulletLife: 2.4, spread: 0.06, delay: 0.25, type: "bullet" }
    ]
  },
  tri_angle: {
    id: "tri_angle",
    name: "Tri-Angle",
    tier: 3,
    upgradesFrom: "flank_guard",
    upgradesTo: ["booster", "fighter"],
    description: "Two rear thruster barrels that provide high-speed rocket propulsion.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 42, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1, recoil: 3.5, bulletSpeed: 10.5, bulletDamage: 14, bulletHealth: 16, bulletSize: 9, bulletLife: 2.5, spread: 0.04, delay: 0, type: "bullet" },
      { length: 32, width: 16, angleOffset: 5 * Math.PI / 6, offsetX: 0, offsetY: 0, reloadMultiplier: 0.85, recoil: 6.5, bulletSpeed: 9.5, bulletDamage: 9.5, bulletHealth: 11, bulletSize: 7.5, bulletLife: 1.8, spread: 0.06, delay: 0.25, type: "bullet" },
      { length: 32, width: 16, angleOffset: -(5 * Math.PI) / 6, offsetX: 0, offsetY: 0, reloadMultiplier: 0.85, recoil: 6.5, bulletSpeed: 9.5, bulletDamage: 9.5, bulletHealth: 11, bulletSize: 7.5, bulletLife: 1.8, spread: 0.06, delay: 0.25, type: "bullet" }
    ]
  },
  quad_tank: {
    id: "quad_tank",
    name: "Quad Tank",
    tier: 3,
    upgradesFrom: "flank_guard",
    upgradesTo: ["octo_tank", "auto_5"],
    description: "Four cardinal cannons firing simultaneously in all 4 directions.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 42, width: 16, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 12, bulletHealth: 14, bulletSize: 8.5, bulletLife: 2.5, spread: 0.04, delay: 0, type: "bullet" },
      { length: 42, width: 16, angleOffset: Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 12, bulletHealth: 14, bulletSize: 8.5, bulletLife: 2.5, spread: 0.04, delay: 0.25, type: "bullet" },
      { length: 42, width: 16, angleOffset: Math.PI, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 12, bulletHealth: 14, bulletSize: 8.5, bulletLife: 2.5, spread: 0.04, delay: 0.5, type: "bullet" },
      { length: 42, width: 16, angleOffset: -Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 12, bulletHealth: 14, bulletSize: 8.5, bulletLife: 2.5, spread: 0.04, delay: 0.75, type: "bullet" }
    ]
  },
  overseer: {
    id: "overseer",
    name: "Overseer",
    tier: 3,
    upgradesFrom: "director",
    upgradesTo: ["overlord", "necromancer", "battleship", "factory"],
    description: "Controls 8 lethal guided drones from twin trapezoidal drone bays.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.2,
    maxDrones: 8,
    droneType: "minion",
    barrels: [
      { length: 38, width: 28, angleOffset: Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 1.8, recoil: 1, bulletSpeed: 7.5, bulletDamage: 22, bulletHealth: 26, bulletSize: 11, bulletLife: 18, spread: 0.05, delay: 0, type: "drone" },
      { length: 38, width: 28, angleOffset: -Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 1.8, recoil: 1, bulletSpeed: 7.5, bulletDamage: 22, bulletHealth: 26, bulletSize: 11, bulletLife: 18, spread: 0.05, delay: 0.5, type: "drone" }
    ]
  },
  cruiser: {
    id: "cruiser",
    name: "Cruiser",
    tier: 3,
    upgradesFrom: "director",
    upgradesTo: ["battleship"],
    description: "Fires fast mini-swarm homing drones that dart towards your mouse.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.15,
    maxDrones: 12,
    droneType: "swarm",
    barrels: [
      { length: 36, width: 20, angleOffset: 0.25, offsetX: 0, offsetY: 0, reloadMultiplier: 0.75, recoil: 1.5, bulletSpeed: 9, bulletDamage: 11, bulletHealth: 11, bulletSize: 8, bulletLife: 6, spread: 0.08, delay: 0, type: "swarm" },
      { length: 36, width: 20, angleOffset: -0.25, offsetX: 0, offsetY: 0, reloadMultiplier: 0.75, recoil: 1.5, bulletSpeed: 9, bulletDamage: 11, bulletHealth: 11, bulletSize: 8, bulletLife: 6, spread: 0.08, delay: 0.5, type: "swarm" }
    ]
  },
  underseer: {
    id: "underseer",
    name: "Underseer",
    tier: 3,
    upgradesFrom: "director",
    upgradesTo: ["overlord", "auto_trapper"],
    description: "Drone commander equipped with rear trap defense launcher.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.15,
    maxDrones: 6,
    maxTraps: 6,
    droneType: "minion",
    barrels: [
      { length: 38, width: 28, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.8, recoil: 1, bulletSpeed: 7.5, bulletDamage: 22, bulletHealth: 25, bulletSize: 11, bulletLife: 18, spread: 0.05, type: "drone" },
      { length: 36, width: 22, angleOffset: Math.PI, offsetX: 0, offsetY: 0, reloadMultiplier: 1.4, recoil: 3, bulletSpeed: 8, bulletDamage: 24, bulletHealth: 35, bulletSize: 11, bulletLife: 12, spread: 0.06, type: "trap" }
    ]
  },
  builder: {
    id: "builder",
    name: "Builder",
    tier: 3,
    upgradesFrom: "pounder",
    upgradesTo: ["mega_trapper", "auto_trapper"],
    description: "Fires heavy hexagonal barricades that absorb incoming projectiles.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.05,
    maxTraps: 10,
    barrels: [
      { length: 42, width: 30, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.6, recoil: 5, bulletSpeed: 8, bulletDamage: 35, bulletHealth: 50, bulletSize: 15, bulletLife: 14, spread: 0.05, type: "trap" }
    ]
  },
  tri_trapper: {
    id: "tri_trapper",
    name: "Tri-Trapper",
    tier: 3,
    upgradesFrom: "trapper",
    upgradesTo: ["mega_trapper", "auto_trapper"],
    description: "Launches traps in three radial directions to build defensive bases.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    maxTraps: 12,
    barrels: [
      { length: 38, width: 24, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.2, recoil: 3.5, bulletSpeed: 8.5, bulletDamage: 25, bulletHealth: 35, bulletSize: 12, bulletLife: 12, spread: 0.05, delay: 0, type: "trap" },
      { length: 38, width: 24, angleOffset: 2 * Math.PI / 3, offsetX: 0, offsetY: 0, reloadMultiplier: 1.2, recoil: 3.5, bulletSpeed: 8.5, bulletDamage: 25, bulletHealth: 35, bulletSize: 12, bulletLife: 12, spread: 0.05, delay: 0.33, type: "trap" },
      { length: 38, width: 24, angleOffset: 4 * Math.PI / 3, offsetX: 0, offsetY: 0, reloadMultiplier: 1.2, recoil: 3.5, bulletSpeed: 8.5, bulletDamage: 25, bulletHealth: 35, bulletSize: 12, bulletLife: 12, spread: 0.05, delay: 0.66, type: "trap" }
    ]
  },
  mega_smasher: {
    id: "mega_smasher",
    name: "Mega Smasher",
    tier: 3,
    upgradesFrom: "smasher",
    upgradesTo: ["spike", "auto_smasher"],
    description: "Enlarged hexagonal body with crushing ramming mass.",
    bodyShape: "hexagon",
    bodyRadius: 28,
    fovMultiplier: 1,
    isRammer: true,
    barrels: []
  },
  landmine: {
    id: "landmine",
    name: "Landmine",
    tier: 3,
    upgradesFrom: "smasher",
    upgradesTo: ["spike"],
    description: "Turns completely invisible after staying still for 2.5 seconds. Lethal ambush rammer.",
    bodyShape: "hexagon",
    bodyRadius: 26,
    fovMultiplier: 1,
    isRammer: true,
    hasInvisibility: true,
    barrels: []
  },
  auto_4: {
    id: "auto_4",
    name: "Auto-4",
    tier: 3,
    upgradesFrom: "auto_3",
    upgradesTo: ["auto_5"],
    description: "Four automated tracking turrets mounted on hull.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.1,
    barrels: [],
    autoTurrets: [
      { radius: 10, offsetDist: 14, angleOffset: 0, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1, recoil: 1.5, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: "bullet" }] },
      { radius: 10, offsetDist: 14, angleOffset: Math.PI / 2, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1, recoil: 1.5, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: "bullet" }] },
      { radius: 10, offsetDist: 14, angleOffset: Math.PI, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1, recoil: 1.5, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: "bullet" }] },
      { radius: 10, offsetDist: 14, angleOffset: -Math.PI / 2, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1, recoil: 1.5, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: "bullet" }] }
    ]
  },
  // === TIER 4 (MAX TIER) ===
  triplet: {
    id: "triplet",
    name: "Triplet",
    tier: 4,
    upgradesFrom: "triplet_shot",
    upgradesTo: [],
    description: "Three tightly-focused forward barrels delivering devastating continuous DPS.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 42, width: 15, angleOffset: 0, offsetX: 0, offsetY: -10, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 11, bulletDamage: 11, bulletHealth: 13, bulletSize: 8, bulletLife: 2.6, spread: 0.03, delay: 0.33, type: "bullet" },
      { length: 46, width: 15, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.5, bulletSpeed: 11, bulletDamage: 12, bulletHealth: 14, bulletSize: 8, bulletLife: 2.6, spread: 0.03, delay: 0, type: "bullet" },
      { length: 42, width: 15, angleOffset: 0, offsetX: 0, offsetY: 10, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 11, bulletDamage: 11, bulletHealth: 13, bulletSize: 8, bulletLife: 2.6, spread: 0.03, delay: 0.66, type: "bullet" }
    ]
  },
  penta_shot: {
    id: "penta_shot",
    name: "Penta Shot",
    tier: 4,
    upgradesFrom: "triplet_shot",
    upgradesTo: [],
    description: "Five spread barrels unleashing a wide wall of bullets and intense rearward recoil.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 36, width: 15, angleOffset: -0.5, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.6, bulletSpeed: 10.5, bulletDamage: 10.5, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.66, type: "bullet" },
      { length: 40, width: 15, angleOffset: -0.25, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 10.5, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.33, type: "bullet" },
      { length: 46, width: 15, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 3.2, bulletSpeed: 10.5, bulletDamage: 12, bulletHealth: 13, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0, type: "bullet" },
      { length: 40, width: 15, angleOffset: 0.25, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 10.5, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.33, type: "bullet" },
      { length: 36, width: 15, angleOffset: 0.5, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.6, bulletSpeed: 10.5, bulletDamage: 10.5, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.66, type: "bullet" }
    ]
  },
  octo_tank: {
    id: "octo_tank",
    name: "Octo Tank",
    tier: 4,
    upgradesFrom: "quad_tank",
    upgradesTo: [],
    description: "Eight barrels firing in all 8 directions. Perfect for crowd control and auto-spin.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 40, width: 15, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0, type: "bullet" },
      { length: 40, width: 15, angleOffset: Math.PI / 4, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.5, type: "bullet" },
      { length: 40, width: 15, angleOffset: Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0, type: "bullet" },
      { length: 40, width: 15, angleOffset: 3 * Math.PI / 4, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.5, type: "bullet" },
      { length: 40, width: 15, angleOffset: Math.PI, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0, type: "bullet" },
      { length: 40, width: 15, angleOffset: -(3 * Math.PI) / 4, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.5, type: "bullet" },
      { length: 40, width: 15, angleOffset: -Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0, type: "bullet" },
      { length: 40, width: 15, angleOffset: -Math.PI / 4, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.5, type: "bullet" }
    ]
  },
  triple_twin: {
    id: "triple_twin",
    name: "Triple Twin",
    tier: 4,
    upgradesFrom: "double_twin",
    upgradesTo: [],
    description: "Three pairs of twin barrels spaced at 120-degree angles.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 42, width: 14, angleOffset: 0, offsetX: 0, offsetY: -8, reloadMultiplier: 0.95, recoil: 2, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 11.5, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0, type: "bullet" },
      { length: 42, width: 14, angleOffset: 0, offsetX: 0, offsetY: 8, reloadMultiplier: 0.95, recoil: 2, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 11.5, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.5, type: "bullet" },
      { length: 42, width: 14, angleOffset: 2 * Math.PI / 3, offsetX: 0, offsetY: -8, reloadMultiplier: 0.95, recoil: 2, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 11.5, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.16, type: "bullet" },
      { length: 42, width: 14, angleOffset: 2 * Math.PI / 3, offsetX: 0, offsetY: 8, reloadMultiplier: 0.95, recoil: 2, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 11.5, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.66, type: "bullet" },
      { length: 42, width: 14, angleOffset: 4 * Math.PI / 3, offsetX: 0, offsetY: -8, reloadMultiplier: 0.95, recoil: 2, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 11.5, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.33, type: "bullet" },
      { length: 42, width: 14, angleOffset: 4 * Math.PI / 3, offsetX: 0, offsetY: 8, reloadMultiplier: 0.95, recoil: 2, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 11.5, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.83, type: "bullet" }
    ]
  },
  ranger: {
    id: "ranger",
    name: "Ranger",
    tier: 4,
    upgradesFrom: "assassin",
    upgradesTo: [],
    description: "Tremendous sniper scope giving maximum FOV zoom and hypersonic bullet velocity.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.85,
    barrels: [
      { length: 80, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.9, recoil: 7.5, bulletSpeed: 19, bulletDamage: 38, bulletHealth: 34, bulletSize: 10.5, bulletLife: 4, spread: 0.01, type: "bullet" }
    ]
  },
  stalker: {
    id: "stalker",
    name: "Stalker",
    tier: 4,
    upgradesFrom: "assassin",
    upgradesTo: [],
    description: "Long sniper barrel with cloaking technology that turns invisible while stationary.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.5,
    hasInvisibility: true,
    barrels: [
      { length: 66, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.7, recoil: 6.5, bulletSpeed: 16.5, bulletDamage: 32, bulletHealth: 30, bulletSize: 10, bulletLife: 3.5, spread: 0.015, type: "bullet" }
    ]
  },
  annihilator: {
    id: "annihilator",
    name: "Annihilator",
    tier: 4,
    upgradesFrom: "destroyer",
    upgradesTo: [],
    description: "Fires the largest projectile in the game with catastrophic damage and rocket recoil.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 44, width: 44, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 2.2, recoil: 16, bulletSpeed: 8.8, bulletDamage: 75, bulletHealth: 80, bulletSize: 26, bulletLife: 3, spread: 0.02, type: "bullet" }
    ]
  },
  hybrid: {
    id: "hybrid",
    name: "Hybrid",
    tier: 4,
    upgradesFrom: "destroyer",
    upgradesTo: [],
    description: "Combines a Destroyer heavy cannon with 2 autonomous guardian drones.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    maxDrones: 2,
    droneType: "protector",
    barrels: [
      { length: 44, width: 34, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 2, recoil: 12, bulletSpeed: 9, bulletDamage: 55, bulletHealth: 55, bulletSize: 20, bulletLife: 2.8, spread: 0.03, type: "bullet" },
      { length: 32, width: 22, angleOffset: Math.PI, offsetX: 0, offsetY: 0, reloadMultiplier: 2.5, recoil: 0.5, bulletSpeed: 7, bulletDamage: 20, bulletHealth: 22, bulletSize: 10, bulletLife: 15, spread: 0.05, type: "drone" }
    ]
  },
  booster: {
    id: "booster",
    name: "Booster",
    tier: 4,
    upgradesFrom: "tri_angle",
    upgradesTo: [],
    description: "Four quad-thruster nozzles on the rear for unmatched acceleration and ramming speed.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 42, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 3.5, bulletSpeed: 10.5, bulletDamage: 14, bulletHealth: 15, bulletSize: 9, bulletLife: 2.5, spread: 0.04, delay: 0, type: "bullet" },
      { length: 34, width: 14, angleOffset: 5 * Math.PI / 6, offsetX: 0, offsetY: 0, reloadMultiplier: 0.75, recoil: 6, bulletSpeed: 9.5, bulletDamage: 9, bulletHealth: 9.5, bulletSize: 7, bulletLife: 1.6, spread: 0.06, delay: 0, type: "bullet" },
      { length: 34, width: 14, angleOffset: -(5 * Math.PI) / 6, offsetX: 0, offsetY: 0, reloadMultiplier: 0.75, recoil: 6, bulletSpeed: 9.5, bulletDamage: 9, bulletHealth: 9.5, bulletSize: 7, bulletLife: 1.6, spread: 0.06, delay: 0, type: "bullet" },
      { length: 30, width: 14, angleOffset: 7 * Math.PI / 8, offsetX: 0, offsetY: 0, reloadMultiplier: 0.75, recoil: 5.5, bulletSpeed: 9, bulletDamage: 9, bulletHealth: 9.5, bulletSize: 7, bulletLife: 1.6, spread: 0.06, delay: 0.5, type: "bullet" },
      { length: 30, width: 14, angleOffset: -(7 * Math.PI) / 8, offsetX: 0, offsetY: 0, reloadMultiplier: 0.75, recoil: 5.5, bulletSpeed: 9, bulletDamage: 9, bulletHealth: 9.5, bulletSize: 7, bulletLife: 1.6, spread: 0.06, delay: 0.5, type: "bullet" }
    ]
  },
  fighter: {
    id: "fighter",
    name: "Fighter",
    tier: 4,
    upgradesFrom: "tri_angle",
    upgradesTo: [],
    description: "Equipped with forward cannon, dual flank cannons, and twin rear thrusters.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1,
    barrels: [
      { length: 42, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 3.5, bulletSpeed: 10.5, bulletDamage: 14, bulletHealth: 15, bulletSize: 9, bulletLife: 2.5, spread: 0.04, delay: 0, type: "bullet" },
      { length: 34, width: 16, angleOffset: Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 3, bulletSpeed: 10.5, bulletDamage: 12, bulletHealth: 13, bulletSize: 8, bulletLife: 2.2, spread: 0.05, delay: 0.25, type: "bullet" },
      { length: 34, width: 16, angleOffset: -Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 3, bulletSpeed: 10.5, bulletDamage: 12, bulletHealth: 13, bulletSize: 8, bulletLife: 2.2, spread: 0.05, delay: 0.25, type: "bullet" },
      { length: 32, width: 16, angleOffset: 5 * Math.PI / 6, offsetX: 0, offsetY: 0, reloadMultiplier: 0.85, recoil: 6, bulletSpeed: 9.5, bulletDamage: 9.5, bulletHealth: 11, bulletSize: 7.5, bulletLife: 1.8, spread: 0.06, delay: 0.5, type: "bullet" },
      { length: 32, width: 16, angleOffset: -(5 * Math.PI) / 6, offsetX: 0, offsetY: 0, reloadMultiplier: 0.85, recoil: 6, bulletSpeed: 9.5, bulletDamage: 9.5, bulletHealth: 11, bulletSize: 7.5, bulletLife: 1.8, spread: 0.06, delay: 0.5, type: "bullet" }
    ]
  },
  overlord: {
    id: "overlord",
    name: "Overlord",
    tier: 4,
    upgradesFrom: "overseer",
    upgradesTo: [],
    description: "Four drone bays that quickly replenish 8 high-powered guided attack drones.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.25,
    maxDrones: 8,
    droneType: "minion",
    barrels: [
      { length: 38, width: 28, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.6, recoil: 1, bulletSpeed: 8, bulletDamage: 26, bulletHealth: 30, bulletSize: 11.5, bulletLife: 20, spread: 0.05, delay: 0, type: "drone" },
      { length: 38, width: 28, angleOffset: Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 1.6, recoil: 1, bulletSpeed: 8, bulletDamage: 26, bulletHealth: 30, bulletSize: 11.5, bulletLife: 20, spread: 0.05, delay: 0.25, type: "drone" },
      { length: 38, width: 28, angleOffset: Math.PI, offsetX: 0, offsetY: 0, reloadMultiplier: 1.6, recoil: 1, bulletSpeed: 8, bulletDamage: 26, bulletHealth: 30, bulletSize: 11.5, bulletLife: 20, spread: 0.05, delay: 0.5, type: "drone" },
      { length: 38, width: 28, angleOffset: -Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 1.6, recoil: 1, bulletSpeed: 8, bulletDamage: 26, bulletHealth: 30, bulletSize: 11.5, bulletLife: 20, spread: 0.05, delay: 0.75, type: "drone" }
    ]
  },
  necromancer: {
    id: "necromancer",
    name: "Necromancer",
    tier: 4,
    upgradesFrom: "overseer",
    upgradesTo: [],
    description: "Converts destroyed yellow squares into a loyal army of up to 24 controllable square drones.",
    bodyShape: "square",
    bodyRadius: 24,
    fovMultiplier: 1.25,
    maxDrones: 24,
    droneType: "square",
    canConvertShapes: true,
    barrels: [
      { length: 38, width: 28, angleOffset: Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 2.5, recoil: 0.5, bulletSpeed: 7.5, bulletDamage: 20, bulletHealth: 22, bulletSize: 11, bulletLife: 35, spread: 0.05, type: "drone" },
      { length: 38, width: 28, angleOffset: -Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 2.5, recoil: 0.5, bulletSpeed: 7.5, bulletDamage: 20, bulletHealth: 22, bulletSize: 11, bulletLife: 35, spread: 0.05, type: "drone" }
    ]
  },
  battleship: {
    id: "battleship",
    name: "Battleship",
    tier: 4,
    upgradesFrom: "cruiser",
    upgradesTo: [],
    description: "Four swarm launcher bays streaming guided and autonomous AI micro-drones.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.2,
    maxDrones: 28,
    droneType: "swarm",
    barrels: [
      { length: 34, width: 18, angleOffset: Math.PI / 3, offsetX: 0, offsetY: 0, reloadMultiplier: 0.45, recoil: 1, bulletSpeed: 9.5, bulletDamage: 9, bulletHealth: 9.5, bulletSize: 7.5, bulletLife: 5.5, spread: 0.1, delay: 0, type: "swarm" },
      { length: 34, width: 18, angleOffset: -Math.PI / 3, offsetX: 0, offsetY: 0, reloadMultiplier: 0.45, recoil: 1, bulletSpeed: 9.5, bulletDamage: 9, bulletHealth: 9.5, bulletSize: 7.5, bulletLife: 5.5, spread: 0.1, delay: 0.25, type: "swarm" },
      { length: 34, width: 18, angleOffset: 2 * Math.PI / 3, offsetX: 0, offsetY: 0, reloadMultiplier: 0.45, recoil: 1, bulletSpeed: 9.5, bulletDamage: 9, bulletHealth: 9.5, bulletSize: 7.5, bulletLife: 5.5, spread: 0.1, delay: 0.5, type: "swarm" },
      { length: 34, width: 18, angleOffset: -(2 * Math.PI) / 3, offsetX: 0, offsetY: 0, reloadMultiplier: 0.45, recoil: 1, bulletSpeed: 9.5, bulletDamage: 9, bulletHealth: 9.5, bulletSize: 7.5, bulletLife: 5.5, spread: 0.1, delay: 0.75, type: "swarm" }
    ]
  },
  factory: {
    id: "factory",
    name: "Factory",
    tier: 4,
    upgradesFrom: "overseer",
    upgradesTo: [],
    description: "Produces miniature minion tanks that follow your crosshair and shoot enemies.",
    bodyShape: "circle",
    bodyRadius: 24,
    fovMultiplier: 1.2,
    maxDrones: 6,
    droneType: "factory_tank",
    barrels: [
      { length: 42, width: 34, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.5, recoil: 1.5, bulletSpeed: 7.5, bulletDamage: 28, bulletHealth: 35, bulletSize: 14, bulletLife: 22, spread: 0.04, type: "drone" }
    ]
  },
  auto_5: {
    id: "auto_5",
    name: "Auto-5",
    tier: 4,
    upgradesFrom: "auto_3",
    upgradesTo: [],
    description: "Equipped with 5 automated tracking turrets providing full 360-degree automatic fire.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.1,
    barrels: [],
    autoTurrets: [
      { radius: 10, offsetDist: 15, angleOffset: 0, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 1.5, bulletSpeed: 11, bulletDamage: 10, bulletHealth: 11, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: "bullet" }] },
      { radius: 10, offsetDist: 15, angleOffset: 2 * Math.PI / 5, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 1.5, bulletSpeed: 11, bulletDamage: 10, bulletHealth: 11, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: "bullet" }] },
      { radius: 10, offsetDist: 15, angleOffset: 4 * Math.PI / 5, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 1.5, bulletSpeed: 11, bulletDamage: 10, bulletHealth: 11, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: "bullet" }] },
      { radius: 10, offsetDist: 15, angleOffset: 6 * Math.PI / 5, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 1.5, bulletSpeed: 11, bulletDamage: 10, bulletHealth: 11, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: "bullet" }] },
      { radius: 10, offsetDist: 15, angleOffset: 8 * Math.PI / 5, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 1.5, bulletSpeed: 11, bulletDamage: 10, bulletHealth: 11, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: "bullet" }] }
    ]
  },
  streamliner: {
    id: "streamliner",
    name: "Streamliner",
    tier: 4,
    upgradesFrom: "gunner",
    upgradesTo: [],
    description: "Five layered sequential barrels projecting a continuous focused laser-beam of bullets.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.45,
    barrels: [
      { length: 36, width: 14, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.32, recoil: 1, bulletSpeed: 13.5, bulletDamage: 6.5, bulletHealth: 8, bulletSize: 6.5, bulletLife: 2.8, spread: 0.03, delay: 0.8, type: "bullet" },
      { length: 42, width: 14, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.32, recoil: 1, bulletSpeed: 13.5, bulletDamage: 6.5, bulletHealth: 8, bulletSize: 6.5, bulletLife: 2.8, spread: 0.03, delay: 0.6, type: "bullet" },
      { length: 48, width: 14, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.32, recoil: 1, bulletSpeed: 13.5, bulletDamage: 6.5, bulletHealth: 8, bulletSize: 6.5, bulletLife: 2.8, spread: 0.03, delay: 0.4, type: "bullet" },
      { length: 54, width: 14, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.32, recoil: 1, bulletSpeed: 13.5, bulletDamage: 6.5, bulletHealth: 8, bulletSize: 6.5, bulletLife: 2.8, spread: 0.03, delay: 0.2, type: "bullet" },
      { length: 60, width: 14, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.32, recoil: 1, bulletSpeed: 13.5, bulletDamage: 6.5, bulletHealth: 8, bulletSize: 6.5, bulletLife: 2.8, spread: 0.03, delay: 0, type: "bullet" }
    ]
  },
  gatling: {
    id: "gatling",
    name: "Gatling Gun",
    tier: 4,
    upgradesFrom: "gunner",
    upgradesTo: [],
    description: "Blistering fire rate minigun that shreds everything in front of it.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.05,
    barrels: [
      { length: 48, width: 14, angleOffset: 0, offsetX: 0, offsetY: -5, reloadMultiplier: 0.22, recoil: 1, bulletSpeed: 12.5, bulletDamage: 6.5, bulletHealth: 8, bulletSize: 6.5, bulletLife: 2.5, spread: 0.12, delay: 0, type: "bullet" },
      { length: 48, width: 14, angleOffset: 0, offsetX: 0, offsetY: 5, reloadMultiplier: 0.22, recoil: 1, bulletSpeed: 12.5, bulletDamage: 6.5, bulletHealth: 8, bulletSize: 6.5, bulletLife: 2.5, spread: 0.12, delay: 0.5, type: "bullet" }
    ]
  },
  skimmer: {
    id: "skimmer",
    name: "Skimmer",
    tier: 4,
    upgradesFrom: "pounder",
    upgradesTo: [],
    description: "Launches large cruise shells that fire bullet trails sideways as they travel.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.1,
    barrels: [
      { length: 44, width: 30, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.6, recoil: 8, bulletSpeed: 11, bulletDamage: 45, bulletHealth: 45, bulletSize: 18, bulletLife: 3.5, spread: 0.03, type: "bullet" }
    ]
  },
  rocketeer: {
    id: "rocketeer",
    name: "Rocketeer",
    tier: 4,
    upgradesFrom: "destroyer",
    upgradesTo: [],
    description: "Fires high-speed propelled rockets that accelerate over distance.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.15,
    barrels: [
      { length: 48, width: 32, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.8, recoil: 10, bulletSpeed: 13, bulletDamage: 55, bulletHealth: 55, bulletSize: 16, bulletLife: 3, spread: 0.02, type: "bullet" }
    ]
  },
  spike: {
    id: "spike",
    name: "Spike",
    tier: 4,
    upgradesFrom: "smasher",
    upgradesTo: [],
    description: "Supreme rammer protected by 4 massive rotating steel spikes with extreme body damage.",
    bodyShape: "spiked",
    bodyRadius: 28,
    fovMultiplier: 1,
    isRammer: true,
    barrels: []
  },
  auto_smasher: {
    id: "auto_smasher",
    name: "Auto-Smasher",
    tier: 4,
    upgradesFrom: "smasher",
    upgradesTo: [],
    description: "Reinforced smasher hull equipped with an automated turret.",
    bodyShape: "hexagon",
    bodyRadius: 27,
    fovMultiplier: 1,
    isRammer: true,
    barrels: [],
    autoTurrets: [
      { radius: 10, offsetDist: 0, angleOffset: 0, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1, recoil: 1.5, bulletSpeed: 11, bulletDamage: 10, bulletHealth: 11, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: "bullet" }] }
    ]
  },
  mega_trapper: {
    id: "mega_trapper",
    name: "Mega Trapper",
    tier: 4,
    upgradesFrom: "trapper",
    upgradesTo: [],
    description: "Fires massive spiked barriers that stop cannonballs and demolish ramming enemies.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.1,
    maxTraps: 10,
    barrels: [
      { length: 44, width: 34, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.8, recoil: 6, bulletSpeed: 9, bulletDamage: 50, bulletHealth: 75, bulletSize: 20, bulletLife: 15, spread: 0.04, type: "trap" }
    ]
  },
  auto_gunner: {
    id: "auto_gunner",
    name: "Auto-Gunner",
    tier: 4,
    upgradesFrom: "gunner",
    upgradesTo: [],
    description: "Four rapid gunner barrels with an automated turret mounted on the hull.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.1,
    barrels: [
      { length: 38, width: 9, angleOffset: 0, offsetX: 0, offsetY: -12, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 6.8, bulletHealth: 8.5, bulletSize: 5.5, bulletLife: 2.2, spread: 0.07, delay: 0, type: "bullet" },
      { length: 38, width: 9, angleOffset: 0, offsetX: 0, offsetY: -4, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 6.8, bulletHealth: 8.5, bulletSize: 5.5, bulletLife: 2.2, spread: 0.07, delay: 0.5, type: "bullet" },
      { length: 38, width: 9, angleOffset: 0, offsetX: 0, offsetY: 4, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 6.8, bulletHealth: 8.5, bulletSize: 5.5, bulletLife: 2.2, spread: 0.07, delay: 0.25, type: "bullet" },
      { length: 38, width: 9, angleOffset: 0, offsetX: 0, offsetY: 12, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 6.8, bulletHealth: 8.5, bulletSize: 5.5, bulletLife: 2.2, spread: 0.07, delay: 0.75, type: "bullet" }
    ],
    autoTurrets: [
      { radius: 10, offsetDist: 0, angleOffset: 0, barrels: [{ length: 20, width: 9, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 9, bulletHealth: 10.5, bulletSize: 6, bulletLife: 2.2, spread: 0.05, type: "bullet" }] }
    ]
  },
  auto_trapper: {
    id: "auto_trapper",
    name: "Auto-Trapper",
    tier: 4,
    upgradesFrom: "trapper",
    upgradesTo: [],
    description: "Lays traps while an automated turret tracks and shoots nearby hostiles.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.1,
    maxTraps: 10,
    barrels: [
      { length: 40, width: 26, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.2, recoil: 3.5, bulletSpeed: 8.5, bulletDamage: 30, bulletHealth: 45, bulletSize: 13, bulletLife: 13, spread: 0.05, type: "trap" }
    ],
    autoTurrets: [
      { radius: 10, offsetDist: 0, angleOffset: 0, barrels: [{ length: 20, width: 9, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 9, bulletHealth: 10.5, bulletSize: 6, bulletLife: 2.2, spread: 0.05, type: "bullet" }] }
    ]
  },
  nailgun: {
    id: "nailgun",
    name: "Nailgun",
    tier: 4,
    upgradesFrom: "gunner",
    upgradesTo: [],
    description: "Rapid bursts of armor-piercing high velocity spikes.",
    bodyShape: "circle",
    bodyRadius: 22,
    fovMultiplier: 1.15,
    barrels: [
      { length: 44, width: 10, angleOffset: -0.15, offsetX: 0, offsetY: -6, reloadMultiplier: 0.45, recoil: 1.5, bulletSpeed: 14, bulletDamage: 8, bulletHealth: 9, bulletSize: 6, bulletLife: 2.4, spread: 0.06, delay: 0, type: "bullet" },
      { length: 48, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.45, recoil: 1.8, bulletSpeed: 14, bulletDamage: 9, bulletHealth: 10, bulletSize: 6, bulletLife: 2.4, spread: 0.04, delay: 0.33, type: "bullet" },
      { length: 44, width: 10, angleOffset: 0.15, offsetX: 0, offsetY: 6, reloadMultiplier: 0.45, recoil: 1.5, bulletSpeed: 14, bulletDamage: 8, bulletHealth: 9, bulletSize: 6, bulletLife: 2.4, spread: 0.06, delay: 0.66, type: "bullet" }
    ]
  },
  // === SPECIAL GOD / BOSS / CHEAT TIERS ===
  arena_closer: {
    id: "arena_closer",
    name: "Arena Closer",
    tier: 5,
    upgradesTo: [],
    description: "The legendary invincible yellow god tank! Huge cannonball that 1-shots anything.",
    bodyShape: "circle",
    bodyRadius: 36,
    fovMultiplier: 1.35,
    bodyColor: "#FFE600",
    barrels: [
      { length: 55, width: 38, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.4, recoil: 4, bulletSpeed: 18, bulletDamage: 250, bulletHealth: 500, bulletSize: 32, bulletLife: 4, spread: 0.02, type: "bullet" }
    ]
  },
  dominator: {
    id: "dominator",
    name: "Dominator",
    tier: 5,
    upgradesTo: [],
    description: "Titan fortress cannon equipped with heavy base artillery.",
    bodyShape: "hexagon",
    bodyRadius: 45,
    fovMultiplier: 1.4,
    bodyColor: "#FFD600",
    barrels: [
      { length: 65, width: 48, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.2, recoil: 10, bulletSpeed: 14, bulletDamage: 180, bulletHealth: 350, bulletSize: 38, bulletLife: 4, spread: 0.02, type: "bullet" }
    ]
  },
  mothership: {
    id: "mothership",
    name: "Mothership",
    tier: 5,
    upgradesTo: [],
    description: "Colossal drone mothership commanding an armada of 32 guided drones.",
    bodyShape: "octagon",
    bodyRadius: 50,
    fovMultiplier: 1.3,
    maxDrones: 32,
    droneType: "minion",
    barrels: [
      { length: 48, width: 34, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.8, recoil: 1, bulletSpeed: 9, bulletDamage: 35, bulletHealth: 45, bulletSize: 14, bulletLife: 25, spread: 0.05, delay: 0, type: "drone" },
      { length: 48, width: 34, angleOffset: Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 0.8, recoil: 1, bulletSpeed: 9, bulletDamage: 35, bulletHealth: 45, bulletSize: 14, bulletLife: 25, spread: 0.05, delay: 0.25, type: "drone" },
      { length: 48, width: 34, angleOffset: Math.PI, offsetX: 0, offsetY: 0, reloadMultiplier: 0.8, recoil: 1, bulletSpeed: 9, bulletDamage: 35, bulletHealth: 45, bulletSize: 14, bulletLife: 25, spread: 0.05, delay: 0.5, type: "drone" },
      { length: 48, width: 34, angleOffset: -Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 0.8, recoil: 1, bulletSpeed: 9, bulletDamage: 35, bulletHealth: 45, bulletSize: 14, bulletLife: 25, spread: 0.05, delay: 0.75, type: "drone" }
    ]
  }
};
function getAvailableUpgrades(currentTankId, level) {
  const current = TANKS[currentTankId] || TANKS["basic"];
  if (level >= 45 && current.tier < 4) {
    if (current.tier === 3) {
      return current.upgradesTo.filter((id) => TANKS[id]);
    }
  }
  if (level >= 30 && current.tier < 3) {
    if (current.tier === 2) {
      return current.upgradesTo.filter((id) => TANKS[id]);
    }
  }
  if (level >= 15 && current.tier < 2) {
    if (current.tier === 1) {
      return current.upgradesTo.filter((id) => TANKS[id]);
    }
  }
  return [];
}

// shared/shapes.ts
var SHAPE_CONFIGS = {
  egg: {
    type: "egg",
    sides: 0,
    // circle
    radius: 10,
    maxHealth: 15,
    damage: 8,
    xp: 40,
    color: "#ECEFF1",
    strokeColor: "#B0BEC5"
  },
  square: {
    type: "square",
    sides: 4,
    radius: 14,
    maxHealth: 26,
    damage: 10,
    xp: 90,
    color: "#FFE600",
    strokeColor: "#D4B800"
  },
  triangle: {
    type: "triangle",
    sides: 3,
    radius: 17,
    maxHealth: 75,
    damage: 20,
    xp: 300,
    color: "#FC7676",
    strokeColor: "#D45050"
  },
  pentagon: {
    type: "pentagon",
    sides: 5,
    radius: 24,
    maxHealth: 250,
    damage: 35,
    xp: 1100,
    color: "#768CFC",
    strokeColor: "#5368D8"
  },
  beta_pentagon: {
    type: "beta_pentagon",
    sides: 5,
    radius: 42,
    maxHealth: 900,
    damage: 65,
    xp: 4500,
    color: "#657DF7",
    strokeColor: "#4358C9"
  },
  alpha_pentagon: {
    type: "alpha_pentagon",
    sides: 5,
    radius: 75,
    maxHealth: 3800,
    damage: 110,
    xp: 35e3,
    color: "#4960E6",
    strokeColor: "#2D41B8"
  },
  crasher: {
    type: "crasher",
    sides: 3,
    radius: 13,
    maxHealth: 40,
    damage: 24,
    xp: 180,
    color: "#F48FB1",
    strokeColor: "#C2185B"
  }
};

// server/room.ts
var TANK_COLORS = [
  "#00B0FF",
  // Cyan / Light Blue
  "#00E676",
  // Bright Green
  "#FF5252",
  // Coral Red
  "#FFD600",
  // Gold Yellow
  "#FF4081",
  // Pink
  "#E040FB",
  // Purple
  "#7C4DFF",
  // Indigo
  "#FF6E40"
  // Orange
];
var BOT_NAMES_NOOB = ["NoobSlayer", "T\u1EADp B\u1EAFn", "G\xE0 M\u1EDBi", "Potato", "Beginner", "Rookie", "Newbie", "Farmer"];
var BOT_NAMES_NORMAL = ["Vector", "Shadow", "Nova", "Echo", "Nexus", "Blitz", "Phoenix", "Quantum", "Glitch", "Striker"];
var BOT_NAMES_PRO = ["APEX_PREDATOR", "GOD_AIM", "VN_CHAMPION", "VORTEX_PRO", "HYDRA_ELITE", "OVERLORD_KING", "SNIPER_GOD"];
var PRO_BOT_TANKS = ["overlord", "annihilator", "booster", "fighter", "octo_tank", "triplet", "streamliner", "factory"];
var GameRoom = class {
  constructor(id, mode) {
    this.arenaSize = 4e3;
    this.zoneRadius = 2e3;
    // For survival mode
    this.players = /* @__PURE__ */ new Map();
    this.projectiles = /* @__PURE__ */ new Map();
    this.shapes = /* @__PURE__ */ new Map();
    this.bosses = /* @__PURE__ */ new Map();
    this.walls = [];
    this.killFeed = [];
    this.targetBotCount = 14;
    this.nextEntityId = 1;
    this.intervalTimer = null;
    this.lastTickTime = Date.now();
    this.bossSpawnCooldown = 15;
    this.id = id;
    this.mode = mode;
    this.setupArena();
  }
  start() {
    if (this.intervalTimer) return;
    this.initShapes();
    this.initBots();
    this.intervalTimer = setInterval(() => {
      this.tick();
    }, 1e3 / 30);
  }
  stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }
  generateId(prefix) {
    return `${prefix}_${this.nextEntityId++}`;
  }
  setupArena() {
    this.zoneRadius = 2200;
    if (this.mode === "maze") {
      this.arenaSize = 3600;
      this.generateMazeWalls();
    } else if (this.mode === "2tdm") {
      this.arenaSize = 4400;
      this.targetBotCount = 16;
    } else if (this.mode === "4tdm") {
      this.arenaSize = 4800;
      this.targetBotCount = 18;
    } else if (this.mode === "siege") {
      this.arenaSize = 3800;
      this.targetBotCount = 8;
      this.spawnBoss("guardian");
    } else if (this.mode === "domination") {
      this.arenaSize = 4200;
      this.targetBotCount = 16;
      this.spawnBoss("dominator");
    } else if (this.mode === "survival") {
      this.arenaSize = 3600;
      this.zoneRadius = 1800;
      this.targetBotCount = 20;
    } else if (this.mode === "juggernaut") {
      this.arenaSize = 4e3;
      this.targetBotCount = 16;
    } else if (this.mode === "sandbox") {
      this.arenaSize = 2600;
      this.targetBotCount = 4;
    } else {
      this.arenaSize = 4200;
      this.targetBotCount = 16;
    }
  }
  generateMazeWalls() {
    const cellSize = 300;
    const gridCount = Math.floor(this.arenaSize / cellSize);
    const half = this.arenaSize / 2;
    for (let r = 1; r < gridCount - 1; r += 2) {
      for (let c = 1; c < gridCount - 1; c += 2) {
        if (Math.random() < 0.65) {
          const isHorizontal = Math.random() < 0.5;
          const x = -half + c * cellSize;
          const y = -half + r * cellSize;
          this.walls.push({
            id: this.generateId("wall"),
            x: isHorizontal ? x : x - 15,
            y: isHorizontal ? y - 15 : y,
            width: isHorizontal ? cellSize * 1.8 : 30,
            height: isHorizontal ? 30 : cellSize * 1.8
          });
        }
      }
    }
  }
  initShapes() {
    const targetShapes = this.mode === "sandbox" ? 60 : 200;
    for (let i = 0; i < targetShapes; i++) {
      this.spawnRandomShape();
    }
  }
  initBots() {
    for (let i = 0; i < this.targetBotCount; i++) {
      this.spawnBot();
    }
  }
  spawnRandomShape() {
    const half = this.arenaSize / 2 - 100;
    const nestRadius = 450;
    const isNest = Math.random() < 0.3;
    let x, y;
    let type = "square";
    if (isNest && this.mode !== "maze") {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * nestRadius;
      x = Math.cos(angle) * dist;
      y = Math.sin(angle) * dist;
      const roll = Math.random();
      if (roll < 0.05) type = "alpha_pentagon";
      else if (roll < 0.22) type = "beta_pentagon";
      else if (roll < 0.7) type = "pentagon";
      else type = "crasher";
    } else {
      x = (Math.random() * 2 - 1) * half;
      y = (Math.random() * 2 - 1) * half;
      const roll = Math.random();
      if (roll < 0.05) type = "egg";
      else if (roll < 0.6) type = "square";
      else if (roll < 0.88) type = "triangle";
      else type = "pentagon";
    }
    const cfg = SHAPE_CONFIGS[type];
    const shape = {
      id: this.generateId("shp"),
      type,
      x,
      y,
      vx: (Math.random() - 0.5) * (type === "crasher" ? 1.5 : 0.4),
      vy: (Math.random() - 0.5) * (type === "crasher" ? 1.5 : 0.4),
      angle: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.03,
      sides: cfg.sides,
      radius: cfg.radius,
      color: cfg.color,
      health: cfg.maxHealth,
      maxHealth: cfg.maxHealth,
      damage: cfg.damage,
      xp: cfg.xp
    };
    this.shapes.set(shape.id, shape);
  }
  getSpawnPosition(team) {
    const half = this.arenaSize / 2;
    if (this.mode === "2tdm") {
      if (team === "blue") {
        return { x: -half + 250 + Math.random() * 200, y: (Math.random() - 0.5) * (half * 0.8) };
      } else {
        return { x: half - 250 - Math.random() * 200, y: (Math.random() - 0.5) * (half * 0.8) };
      }
    } else if (this.mode === "4tdm") {
      const cornerOffset = half - 300;
      switch (team) {
        case "blue":
          return { x: -cornerOffset + Math.random() * 150, y: -cornerOffset + Math.random() * 150 };
        case "red":
          return { x: cornerOffset - Math.random() * 150, y: -cornerOffset + Math.random() * 150 };
        case "green":
          return { x: -cornerOffset + Math.random() * 150, y: cornerOffset - Math.random() * 150 };
        case "yellow":
          return { x: cornerOffset - Math.random() * 150, y: cornerOffset - Math.random() * 150 };
        default:
          break;
      }
    }
    const angle = Math.random() * Math.PI * 2;
    const dist = 400 + Math.random() * Math.min(half - 600, this.zoneRadius - 100);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  }
  assignTeam() {
    if (this.mode === "2tdm") {
      let blue = 0, red = 0;
      this.players.forEach((p) => {
        if (p.team === "blue") blue++;
        if (p.team === "red") red++;
      });
      return blue <= red ? "blue" : "red";
    } else if (this.mode === "4tdm") {
      const counts = { blue: 0, red: 0, green: 0, yellow: 0, neutral: 0, boss: 0 };
      this.players.forEach((p) => counts[p.team]++);
      const teams = ["blue", "red", "green", "yellow"];
      teams.sort((a, b) => counts[a] - counts[b]);
      return teams[0];
    }
    return "neutral";
  }
  addHumanPlayer(id, ws, name, preferredColor) {
    const team = this.assignTeam();
    const spawn = this.getSpawnPosition(team);
    const color = team !== "neutral" ? team === "blue" ? "#00B0FF" : team === "red" ? "#FF5252" : team === "green" ? "#00E676" : "#FFD600" : preferredColor || TANK_COLORS[Math.floor(Math.random() * TANK_COLORS.length)];
    const player = {
      id,
      ws,
      name: name.trim().slice(0, 16) || "Tank",
      isBot: false,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      angle: 0,
      tankId: "basic",
      score: 0,
      exp: 0,
      level: 1,
      health: 100,
      maxHealth: 100,
      team,
      color,
      statPoints: 0,
      stats: {
        movementSpeed: 0,
        reload: 0,
        bulletDamage: 0,
        bulletPenetration: 0,
        bulletSpeed: 0,
        bodyDamage: 0,
        maxHealth: 0,
        healthRegen: 0
      },
      input: {
        up: false,
        down: false,
        left: false,
        right: false,
        mouseX: spawn.x,
        mouseY: spawn.y,
        angle: 0,
        isShooting: false,
        autoFire: false,
        autoSpin: false
      },
      lastDamageTime: Date.now(),
      lastShootTime: [0, 0, 0, 0, 0, 0, 0, 0],
      recoilOffsets: [0, 0, 0, 0, 0, 0, 0, 0],
      autoTurretAngles: [0, 0, 0, 0, 0],
      killCount: 0,
      shapesDestroyed: 0,
      spawnTime: Date.now(),
      invisibility: 0,
      isDead: false,
      dronesCount: 0,
      trapsCount: 0
    };
    if (this.mode === "sandbox") {
      player.exp = LEVEL_EXP_TABLE[44];
      player.level = 45;
      player.statPoints = 33;
    }
    this.players.set(id, player);
    return player;
  }
  // --- BOT GENERATION WITH 3 TIERS (Noob, Normal, Pro) ---
  spawnBot() {
    const team = this.assignTeam();
    const spawn = this.getSpawnPosition(team);
    const id = this.generateId("bot");
    const roll = Math.random();
    let botTier = "normal";
    let botName = "";
    let startLevel = 1;
    if (roll < 0.4) {
      botTier = "noob";
      botName = `[Noob] ${BOT_NAMES_NOOB[Math.floor(Math.random() * BOT_NAMES_NOOB.length)]}`;
      startLevel = Math.floor(1 + Math.random() * 14);
    } else if (roll < 0.8) {
      botTier = "normal";
      botName = BOT_NAMES_NORMAL[Math.floor(Math.random() * BOT_NAMES_NORMAL.length)];
      startLevel = Math.floor(15 + Math.random() * 20);
    } else {
      botTier = "pro";
      botName = `\u2605 ${BOT_NAMES_PRO[Math.floor(Math.random() * BOT_NAMES_PRO.length)]}`;
      startLevel = 45;
    }
    const startExp = LEVEL_EXP_TABLE[startLevel - 1] || 0;
    const color = team !== "neutral" ? team === "blue" ? "#00B0FF" : team === "red" ? "#FF5252" : team === "green" ? "#00E676" : "#FFD600" : TANK_COLORS[Math.floor(Math.random() * TANK_COLORS.length)];
    const bot = {
      id,
      name: botName,
      isBot: true,
      botTier,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      angle: Math.random() * Math.PI * 2,
      tankId: "basic",
      score: startExp,
      exp: startExp,
      level: startLevel,
      health: 100,
      maxHealth: 100,
      team,
      color,
      statPoints: startLevel - 1,
      stats: {
        movementSpeed: 0,
        reload: 0,
        bulletDamage: 0,
        bulletPenetration: 0,
        bulletSpeed: 0,
        bodyDamage: 0,
        maxHealth: 0,
        healthRegen: 0
      },
      input: {
        up: false,
        down: false,
        left: false,
        right: false,
        mouseX: 0,
        mouseY: 0,
        angle: 0,
        isShooting: true,
        autoFire: true,
        autoSpin: false
      },
      lastDamageTime: Date.now(),
      lastShootTime: [0, 0, 0, 0, 0, 0, 0, 0],
      recoilOffsets: [0, 0, 0, 0, 0, 0, 0, 0],
      autoTurretAngles: [0, 0, 0, 0, 0],
      killCount: 0,
      shapesDestroyed: 0,
      spawnTime: Date.now(),
      invisibility: 0,
      isDead: false,
      dronesCount: 0,
      trapsCount: 0,
      dodgeDir: Math.random() < 0.5 ? 1 : -1
    };
    if (botTier === "pro") {
      bot.stats.bulletDamage = 7;
      bot.stats.bulletPenetration = 7;
      bot.stats.reload = 7;
      bot.stats.movementSpeed = 6;
      bot.stats.maxHealth = 4;
      bot.stats.healthRegen = 2;
      bot.statPoints = 0;
      bot.maxHealth = 100 + bot.stats.maxHealth * 25;
      bot.health = bot.maxHealth;
      const proTank = PRO_BOT_TANKS[Math.floor(Math.random() * PRO_BOT_TANKS.length)];
      bot.tankId = proTank;
    } else {
      this.autoAllocateBotStats(bot);
      this.autoUpgradeBotTank(bot);
    }
    this.players.set(id, bot);
  }
  autoAllocateBotStats(bot) {
    const keys = [
      "movementSpeed",
      "reload",
      "bulletDamage",
      "bulletPenetration",
      "bulletSpeed",
      "bodyDamage",
      "maxHealth",
      "healthRegen"
    ];
    while (bot.statPoints > 0) {
      const key = keys[Math.floor(Math.random() * keys.length)];
      if (bot.stats[key] < 7) {
        bot.stats[key]++;
        bot.statPoints--;
      } else {
        break;
      }
    }
    bot.maxHealth = 100 + bot.stats.maxHealth * 25;
    bot.health = bot.maxHealth;
  }
  autoUpgradeBotTank(bot) {
    let avail = getAvailableUpgrades(bot.tankId, bot.level);
    while (avail.length > 0) {
      const pick = avail[Math.floor(Math.random() * avail.length)];
      bot.tankId = pick;
      avail = getAvailableUpgrades(bot.tankId, bot.level);
    }
  }
  removePlayer(id) {
    this.players.delete(id);
    for (const [projId, proj] of this.projectiles.entries()) {
      if (proj.ownerId === id) {
        this.projectiles.delete(projId);
      }
    }
  }
  handlePlayerInput(id, input) {
    const p = this.players.get(id);
    if (!p || p.isDead) return;
    p.input = input;
  }
  handleStatUpgrade(id, statKey) {
    const p = this.players.get(id);
    if (!p || p.statPoints <= 0) return;
    if (p.stats[statKey] < 7) {
      p.stats[statKey]++;
      p.statPoints--;
      if (statKey === "maxHealth") {
        const added = 25;
        p.maxHealth += added;
        p.health += added;
      }
    }
  }
  handleTankUpgrade(id, newTankId) {
    const p = this.players.get(id);
    if (!p) return;
    if (this.mode === "sandbox" || p.isGodmode) {
      if (TANKS[newTankId]) {
        p.tankId = newTankId;
      }
      return;
    }
    const avail = getAvailableUpgrades(p.tankId, p.level);
    if (avail.includes(newTankId) && TANKS[newTankId]) {
      p.tankId = newTankId;
    }
  }
  // --- CHEAT CODES HANDLER ---
  handleCheatCode(id, rawCode) {
    const p = this.players.get(id);
    if (!p) return "Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi ch\u01A1i";
    const code = rawCode.trim().toLowerCase();
    if (code === "god" || code === "godmode" || code === "bat_tu") {
      p.isGodmode = !p.isGodmode;
      p.health = p.maxHealth;
      return p.isGodmode ? "\u{1F6E1}\uFE0F \u0110\xC3 B\u1EACT GOD MODE (B\u1EA4T T\u1EEC)!" : "\u{1F6E1}\uFE0F \u0110\xC3 T\u1EAET GOD MODE!";
    }
    if (code === "max" || code === "level45" || code === "max_level" || code === "cap45") {
      p.exp = LEVEL_EXP_TABLE[44];
      p.level = 45;
      p.statPoints = 33;
      return "\u2B50 \u0110\xC3 L\xCAN C\u1EA4P 45 V\xC0 NH\u1EACN 33 \u0110I\u1EC2M N\xC2NG C\u1EA4P!";
    }
    if (code === "nuke" || code === "bom" || code === "bomb") {
      let wipedCount = 0;
      for (const [sId, s] of this.shapes.entries()) {
        if (Math.hypot(s.x - p.x, s.y - p.y) < 950) {
          this.handleShapeDestroyed(s, p.id);
          this.shapes.delete(sId);
          wipedCount++;
        }
      }
      for (const other of this.players.values()) {
        if (other.id !== p.id && !other.isDead && (this.mode === "ffa" || other.team !== p.team)) {
          if (Math.hypot(other.x - p.x, other.y - p.y) < 950) {
            this.handlePlayerKilled(other, p.id);
            wipedCount++;
          }
        }
      }
      return `\u{1F4A3} NUKE TO\xC0N B\u1EA2N \u0110\u1ED2! \u0110\xE3 x\xF3a s\u1ED5 ${wipedCount} m\u1EE5c ti\xEAu!`;
    }
    if (code === "closer" || code === "arena_closer") {
      p.tankId = "arena_closer";
      p.level = 45;
      p.color = "#FFE600";
      p.maxHealth = 2e3;
      p.health = 2e3;
      return "\u{1F451} \u0110\xC3 BI\u1EBEN TH\xC0NH HUY\u1EC0N THO\u1EA0I ARENA CLOSER!";
    }
    if (code === "dominator") {
      p.tankId = "dominator";
      p.level = 45;
      p.color = "#FFD600";
      p.maxHealth = 3e3;
      p.health = 3e3;
      return "\u{1F3F0} \u0110\xC3 BI\u1EBEN TH\xC0NH PH\xC1O \u0110\xC0I DOMINATOR!";
    }
    if (code === "mothership") {
      p.tankId = "mothership";
      p.level = 45;
      p.maxHealth = 4e3;
      p.health = 4e3;
      return "\u{1F6F8} \u0110\xC3 BI\u1EBEN TH\xC0NH MOTHERSHIP (32 DRONES)!";
    }
    if (code === "speed" || code === "turbo" || code === "toc_do") {
      p.stats.movementSpeed = 15;
      return "\u26A1 SI\xCAU T\u1ED0C \u0110\u1ED8 TURBO 3X!";
    }
    if (code === "score" || code === "xp" || code === "tien") {
      p.score += 5e4;
      p.exp += 5e4;
      this.checkLevelUp(p);
      return "\u{1F4B0} +50,000 \u0110I\u1EC2M KINH NGHI\u1EC6M!";
    }
    if (code === "rainbow" || code === "disco") {
      p.rainbowSkin = !p.rainbowSkin;
      return p.rainbowSkin ? "\u{1F308} \u0110\xC3 B\u1EACT SKIN C\u1EA6U V\u1ED2NG 7 M\xC0U!" : "\u{1F308} \u0110\xC3 T\u1EAET SKIN C\u1EA6U V\u1ED2NG!";
    }
    if (code === "heal" || code === "hoi_mau") {
      p.health = p.maxHealth;
      return "\u2764\uFE0F \u0110\xC3 H\u1ED2I \u0110\u1EA6Y 100% M\xC1U!";
    }
    if (code === "boss") {
      this.spawnBoss("guardian");
      return "\u{1F479} \u0110\xC3 TRI\u1EC6U H\u1ED2I GUARDIAN BOSS!";
    }
    return `\u2753 L\u1EC7nh kh\xF4ng r\xF5: "${code}". C\xE1c l\u1EC7nh h\u1EE3p l\u1EC7: god, max, nuke, closer, dominator, mothership, speed, score, rainbow, heal, boss`;
  }
  handleSandboxAction(id, action, data) {
    const p = this.players.get(id);
    if (!p) return;
    if (action === "cheat") {
      this.handleCheatCode(id, data?.code || "");
    } else if (action === "max_level") {
      p.exp = LEVEL_EXP_TABLE[44];
      p.level = 45;
      p.statPoints = 33;
    } else if (action === "set_tank" && data?.tankId && TANKS[data.tankId]) {
      p.tankId = data.tankId;
    } else if (action === "heal") {
      p.health = p.maxHealth;
    } else if (action === "spawn_boss") {
      this.spawnBoss(data?.bossType || "guardian");
    } else if (action === "spawn_shapes") {
      for (let i = 0; i < 20; i++) this.spawnRandomShape();
    } else if (action === "spawn_bot") {
      this.spawnBot();
    }
  }
  spawnBoss(bossType) {
    const bossId = this.generateId("boss");
    let name = "Guardian of the Pentagons";
    let color = "#F48FB1";
    let maxHealth = 12e3;
    let radius = 65;
    if (bossType === "fallen_overlord") {
      name = "Fallen Overlord";
      color = "#78909C";
      maxHealth = 18e3;
      radius = 70;
    } else if (bossType === "summoner") {
      name = "The Summoner";
      color = "#FFE082";
      maxHealth = 22e3;
      radius = 75;
    } else if (bossType === "dominator") {
      name = "Neutral Dominator";
      color = "#FFD600";
      maxHealth = 25e3;
      radius = 60;
    }
    const boss = {
      id: bossId,
      name,
      x: (Math.random() - 0.5) * 600,
      y: (Math.random() - 0.5) * 600,
      vx: 0,
      vy: 0,
      angle: 0,
      health: maxHealth,
      maxHealth,
      radius,
      color,
      bossType,
      lastShootTime: Date.now(),
      spawnCrasherCooldown: 0
    };
    this.bosses.set(bossId, boss);
  }
  // --- CORE GAME TICK ---
  tick() {
    const now = Date.now();
    const dt = Math.min(0.06, (now - this.lastTickTime) / 1e3);
    this.lastTickTime = now;
    if (this.mode === "survival" && this.zoneRadius > 350) {
      this.zoneRadius -= dt * 15;
    }
    for (const p of this.players.values()) {
      if (p.rainbowSkin) {
        const hue = now / 15 % 360;
        p.color = `hsl(${hue}, 90%, 55%)`;
      }
    }
    let botCount = 0;
    for (const p of this.players.values()) {
      if (p.isBot) botCount++;
    }
    if (botCount < this.targetBotCount) {
      this.spawnBot();
    }
    const targetShapes = this.mode === "sandbox" ? 60 : 200;
    if (this.shapes.size < targetShapes && Math.random() < 0.45) {
      this.spawnRandomShape();
    }
    if (this.mode === "siege" && this.bosses.size < 2) {
      this.bossSpawnCooldown -= dt;
      if (this.bossSpawnCooldown <= 0) {
        this.bossSpawnCooldown = 30;
        const types = ["guardian", "fallen_overlord", "summoner"];
        this.spawnBoss(types[Math.floor(Math.random() * types.length)]);
      }
    }
    this.updateBotsAI(dt);
    this.updateBosses(dt, now);
    for (const p of this.players.values()) {
      if (p.isDead) continue;
      this.updatePlayer(p, dt, now);
    }
    this.updateProjectiles(dt, now);
    this.updateShapes(dt);
    this.handleCollisions();
    this.broadcastSnapshot();
  }
  // --- INTELLIGENT BOT BEHAVIOR (Differentiated by Tier) ---
  updateBotsAI(dt) {
    for (const bot of this.players.values()) {
      if (!bot.isBot || bot.isDead) continue;
      const tier = bot.botTier || "normal";
      let nearestThreat = null;
      let nearestShape = null;
      for (const other of this.players.values()) {
        if (other.id === bot.id || other.isDead) continue;
        if (this.mode !== "ffa" && this.mode !== "maze" && other.team === bot.team) continue;
        const dist = Math.hypot(other.x - bot.x, other.y - bot.y);
        const scanRange = tier === "pro" ? 950 : tier === "normal" ? 700 : 500;
        if (dist < scanRange) {
          if (!nearestThreat || dist < nearestThreat.dist) {
            nearestThreat = { x: other.x, y: other.y, dist, isEnemy: true };
          }
        }
      }
      if (!nearestThreat) {
        for (const shape of this.shapes.values()) {
          const dist = Math.hypot(shape.x - bot.x, shape.y - bot.y);
          if (dist < 550) {
            if (!nearestShape || dist < nearestShape.dist) {
              nearestShape = { x: shape.x, y: shape.y, dist };
            }
          }
        }
      }
      if (!nearestThreat && this.bosses.size > 0) {
        for (const boss of this.bosses.values()) {
          const dist = Math.hypot(boss.x - bot.x, boss.y - bot.y);
          if (dist < 800) {
            nearestThreat = { x: boss.x, y: boss.y, dist, isEnemy: true };
            break;
          }
        }
      }
      if (nearestThreat) {
        let aimAngle = Math.atan2(nearestThreat.y - bot.y, nearestThreat.x - bot.x);
        if (tier === "noob") {
          aimAngle += (Math.random() - 0.5) * 0.35;
          bot.angle = aimAngle;
          bot.input.mouseX = bot.x + Math.cos(aimAngle) * 300;
          bot.input.mouseY = bot.y + Math.sin(aimAngle) * 300;
          bot.input.isShooting = true;
          bot.input.up = Math.sin(aimAngle) < -0.2;
          bot.input.down = Math.sin(aimAngle) > 0.2;
          bot.input.left = Math.cos(aimAngle) < -0.2;
          bot.input.right = Math.cos(aimAngle) > 0.2;
        } else if (tier === "pro") {
          bot.angle = aimAngle;
          bot.input.mouseX = nearestThreat.x;
          bot.input.mouseY = nearestThreat.y;
          bot.input.isShooting = true;
          if (bot.health < bot.maxHealth * 0.35) {
            const retreatAngle = aimAngle + Math.PI;
            bot.input.up = Math.sin(retreatAngle) < -0.2;
            bot.input.down = Math.sin(retreatAngle) > 0.2;
            bot.input.left = Math.cos(retreatAngle) < -0.2;
            bot.input.right = Math.cos(retreatAngle) > 0.2;
          } else {
            const strafeAngle = aimAngle + Math.PI / 2 * (bot.dodgeDir || 1);
            if (Math.random() < 0.05) bot.dodgeDir = (bot.dodgeDir || 1) * -1;
            bot.input.up = Math.sin(strafeAngle) < -0.2;
            bot.input.down = Math.sin(strafeAngle) > 0.2;
            bot.input.left = Math.cos(strafeAngle) < -0.2;
            bot.input.right = Math.cos(strafeAngle) > 0.2;
          }
        } else {
          bot.angle = aimAngle;
          bot.input.mouseX = nearestThreat.x;
          bot.input.mouseY = nearestThreat.y;
          bot.input.isShooting = true;
          if (bot.health < bot.maxHealth * 0.3) {
            const retreatAngle = aimAngle + Math.PI;
            bot.input.up = Math.sin(retreatAngle) < -0.3;
            bot.input.down = Math.sin(retreatAngle) > 0.3;
            bot.input.left = Math.cos(retreatAngle) < -0.3;
            bot.input.right = Math.cos(retreatAngle) > 0.3;
          } else {
            const moveAngle = aimAngle + (nearestThreat.dist < 320 ? Math.PI * 0.5 : 0);
            bot.input.up = Math.sin(moveAngle) < -0.3;
            bot.input.down = Math.sin(moveAngle) > 0.3;
            bot.input.left = Math.cos(moveAngle) < -0.3;
            bot.input.right = Math.cos(moveAngle) > 0.3;
          }
        }
      } else if (nearestShape) {
        const aimAngle = Math.atan2(nearestShape.y - bot.y, nearestShape.x - bot.x);
        bot.angle = aimAngle;
        bot.input.mouseX = nearestShape.x;
        bot.input.mouseY = nearestShape.y;
        bot.input.isShooting = true;
        bot.input.up = Math.sin(aimAngle) < -0.3;
        bot.input.down = Math.sin(aimAngle) > 0.3;
        bot.input.left = Math.cos(aimAngle) < -0.3;
        bot.input.right = Math.cos(aimAngle) > 0.3;
      } else {
        bot.angle += (Math.random() - 0.5) * 0.08;
        bot.input.up = Math.sin(bot.angle) < -0.3;
        bot.input.down = Math.sin(bot.angle) > 0.3;
        bot.input.left = Math.cos(bot.angle) < -0.3;
        bot.input.right = Math.cos(bot.angle) > 0.3;
        bot.input.isShooting = false;
      }
      if (bot.statPoints > 0) {
        this.autoAllocateBotStats(bot);
      }
      if (tier !== "pro") {
        this.autoUpgradeBotTank(bot);
      }
    }
  }
  updatePlayer(p, dt, now) {
    const tankDef = TANKS[p.tankId] || TANKS["basic"];
    if (p.input.autoSpin) {
      p.angle += 0.04;
    } else if (!p.isBot) {
      p.angle = Math.atan2(p.input.mouseY - p.y, p.input.mouseX - p.x);
    }
    const baseSpeed = 270 + p.stats.movementSpeed * 32;
    let moveX = 0;
    let moveY = 0;
    if (p.input.up) moveY -= 1;
    if (p.input.down) moveY += 1;
    if (p.input.left) moveX -= 1;
    if (p.input.right) moveX += 1;
    if (moveX !== 0 && moveY !== 0) {
      const len = Math.SQRT2;
      moveX /= len;
      moveY /= len;
    }
    const accel = 1900;
    p.vx += moveX * accel * dt;
    p.vy += moveY * accel * dt;
    const drag = 0.9;
    p.vx *= drag;
    p.vy *= drag;
    const currentSpeed = Math.hypot(p.vx, p.vy);
    if (currentSpeed > baseSpeed) {
      p.vx = p.vx / currentSpeed * baseSpeed;
      p.vy = p.vy / currentSpeed * baseSpeed;
    }
    if (tankDef.hasInvisibility) {
      const isMoving = currentSpeed > 10 || p.input.isShooting;
      if (isMoving) {
        p.invisibility = Math.max(0, p.invisibility - dt * 3);
      } else {
        p.invisibility = Math.min(1, p.invisibility + dt * 0.4);
      }
    } else {
      p.invisibility = 0;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (this.mode === "survival") {
      const distFromCenter = Math.hypot(p.x, p.y);
      if (distFromCenter > this.zoneRadius && !p.isGodmode) {
        p.health -= 18 * dt;
        p.lastDamageTime = now;
        if (p.health <= 0) {
          this.handlePlayerKilled(p, "The Red Storm Barrier");
        }
      }
    }
    const half = this.arenaSize / 2 - tankDef.bodyRadius;
    if (p.x < -half) {
      p.x = -half;
      p.vx = 0;
    }
    if (p.x > half) {
      p.x = half;
      p.vx = 0;
    }
    if (p.y < -half) {
      p.y = -half;
      p.vy = 0;
    }
    if (p.y > half) {
      p.y = half;
      p.vy = 0;
    }
    this.handleWallCollision(p, tankDef.bodyRadius);
    const timeSinceDamage = (now - p.lastDamageTime) / 1e3;
    if (timeSinceDamage > 2.5 && p.health < p.maxHealth) {
      const regenRate = p.maxHealth * 0.1 + p.stats.healthRegen * (p.maxHealth * 0.045);
      p.health = Math.min(p.maxHealth, p.health + regenRate * dt);
    }
    for (let i = 0; i < p.recoilOffsets.length; i++) {
      if (p.recoilOffsets[i] > 0) {
        p.recoilOffsets[i] = Math.max(0, p.recoilOffsets[i] - dt * 45);
      }
    }
    if (tankDef.autoTurrets && tankDef.autoTurrets.length > 0) {
      this.updateAutoTurrets(p, dt, now);
    }
    const wantsToShoot = p.input.isShooting || p.input.autoFire;
    if (wantsToShoot && tankDef.barrels.length > 0) {
      this.firePlayerBarrels(p, tankDef.barrels, p.angle, now);
    }
  }
  handleWallCollision(entity, radius) {
    if (this.walls.length === 0) return;
    for (const wall of this.walls) {
      const closestX = Math.max(wall.x - wall.width / 2, Math.min(entity.x, wall.x + wall.width / 2));
      const closestY = Math.max(wall.y - wall.height / 2, Math.min(entity.y, wall.y + wall.height / 2));
      const dx = entity.x - closestX;
      const dy = entity.y - closestY;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        const overlap = radius - dist;
        if (dist > 1e-3) {
          entity.x += dx / dist * overlap;
          entity.y += dy / dist * overlap;
          entity.vx *= 0.5;
          entity.vy *= 0.5;
        } else {
          entity.x += radius;
        }
      }
    }
  }
  updateAutoTurrets(p, dt, now) {
    const tankDef = TANKS[p.tankId];
    if (!tankDef || !tankDef.autoTurrets) return;
    if (!p.autoTurretAngles) {
      p.autoTurretAngles = tankDef.autoTurrets.map(() => 0);
    }
    let targetX = 0, targetY = 0, hasTarget = false;
    let minDist = 750;
    for (const other of this.players.values()) {
      if (other.id === p.id || other.isDead) continue;
      if (this.mode !== "ffa" && this.mode !== "maze" && other.team === p.team) continue;
      const d = Math.hypot(other.x - p.x, other.y - p.y);
      if (d < minDist) {
        minDist = d;
        targetX = other.x;
        targetY = other.y;
        hasTarget = true;
      }
    }
    if (!hasTarget) {
      for (const shape of this.shapes.values()) {
        const d = Math.hypot(shape.x - p.x, shape.y - p.y);
        if (d < 450) {
          targetX = shape.x;
          targetY = shape.y;
          hasTarget = true;
          break;
        }
      }
    }
    tankDef.autoTurrets.forEach((turret, index) => {
      const turretWorldX = p.x + Math.cos(p.angle + turret.angleOffset) * turret.offsetDist;
      const turretWorldY = p.y + Math.sin(p.angle + turret.angleOffset) * turret.offsetDist;
      if (hasTarget) {
        const targetAngle = Math.atan2(targetY - turretWorldY, targetX - turretWorldX);
        p.autoTurretAngles[index] = targetAngle;
        this.firePlayerBarrels(p, turret.barrels, targetAngle, now, turretWorldX, turretWorldY);
      } else {
        p.autoTurretAngles[index] += 0.03;
      }
    });
  }
  firePlayerBarrels(p, barrels, baseAngle, now, originX, originY) {
    const reloadFactor = Math.max(0.3, 1 - p.stats.reload * 0.08);
    barrels.forEach((b, bIdx) => {
      const barrelCooldown = b.reloadMultiplier * reloadFactor * 500;
      const lastShot = p.lastShootTime[bIdx] || 0;
      if (now - lastShot >= barrelCooldown) {
        p.lastShootTime[bIdx] = now;
        p.recoilOffsets[bIdx] = b.recoil * 1.5;
        const fireAngle = baseAngle + b.angleOffset + (Math.random() - 0.5) * b.spread;
        const rootX = originX !== void 0 ? originX : p.x;
        const rootY = originY !== void 0 ? originY : p.y;
        const tipX = rootX + Math.cos(fireAngle) * b.length - Math.sin(fireAngle) * b.offsetY;
        const tipY = rootY + Math.sin(fireAngle) * b.length + Math.cos(fireAngle) * b.offsetY;
        const recoilPower = b.recoil * 18;
        p.vx -= Math.cos(fireAngle) * recoilPower;
        p.vy -= Math.sin(fireAngle) * recoilPower;
        const damage = b.bulletDamage * (1 + p.stats.bulletDamage * 0.35);
        const health = b.bulletHealth * (1 + p.stats.bulletPenetration * 0.45);
        const speed = b.bulletSpeed * 42 + p.stats.bulletSpeed * 40;
        const projType = b.type || "bullet";
        if (projType === "drone" || projType === "swarm") {
          const tankDef = TANKS[p.tankId];
          const maxDrones = tankDef.maxDrones || 8;
          if (p.dronesCount >= maxDrones) return;
          p.dronesCount++;
        }
        if (projType === "trap") {
          const tankDef = TANKS[p.tankId];
          const maxTraps = tankDef.maxTraps || 10;
          if (p.trapsCount >= maxTraps) return;
          p.trapsCount++;
        }
        const proj = {
          id: this.generateId("proj"),
          ownerId: p.id,
          ownerTeam: p.team,
          x: tipX,
          y: tipY,
          vx: Math.cos(fireAngle) * speed + p.vx * 0.2,
          vy: Math.sin(fireAngle) * speed + p.vy * 0.2,
          radius: b.bulletSize,
          color: p.color,
          team: p.team,
          type: projType,
          angle: fireAngle,
          damage,
          health,
          maxHealth: health,
          createdAt: now,
          lifeTime: b.bulletLife * 1e3,
          shapeSides: projType === "drone" ? 3 : projType === "trap" ? 3 : 0
        };
        this.projectiles.set(proj.id, proj);
      }
    });
  }
  updateBosses(dt, now) {
    for (const boss of this.bosses.values()) {
      let nearestDist = 1200;
      let targetX = 0, targetY = 0, hasTarget = false;
      for (const p of this.players.values()) {
        if (p.isDead) continue;
        const d = Math.hypot(p.x - boss.x, p.y - boss.y);
        if (d < nearestDist) {
          nearestDist = d;
          targetX = p.x;
          targetY = p.y;
          hasTarget = true;
        }
      }
      if (hasTarget) {
        boss.angle = Math.atan2(targetY - boss.y, targetX - boss.x);
        boss.vx += Math.cos(boss.angle) * 120 * dt;
        boss.vy += Math.sin(boss.angle) * 120 * dt;
      } else {
        boss.angle += 0.02;
        boss.vx *= 0.95;
        boss.vy *= 0.95;
      }
      boss.vx *= 0.94;
      boss.vy *= 0.94;
      boss.x += boss.vx * dt;
      boss.y += boss.vy * dt;
      if (now - boss.lastShootTime > 1800) {
        boss.lastShootTime = now;
        const bulletCount = boss.bossType === "guardian" ? 12 : 16;
        for (let i = 0; i < bulletCount; i++) {
          const shootAngle = boss.angle + i * Math.PI * 2 / bulletCount;
          const proj = {
            id: this.generateId("boss_proj"),
            ownerId: boss.id,
            ownerTeam: "boss",
            x: boss.x + Math.cos(shootAngle) * boss.radius,
            y: boss.y + Math.sin(shootAngle) * boss.radius,
            vx: Math.cos(shootAngle) * 320,
            vy: Math.sin(shootAngle) * 320,
            radius: 12,
            color: boss.color,
            team: "boss",
            type: "bullet",
            angle: shootAngle,
            damage: 35,
            health: 40,
            maxHealth: 40,
            createdAt: now,
            lifeTime: 4e3
          };
          this.projectiles.set(proj.id, proj);
        }
        if (boss.bossType === "guardian" && Math.random() < 0.6) {
          const crasherAngle = Math.random() * Math.PI * 2;
          const crasherShape = {
            id: this.generateId("crasher"),
            type: "crasher",
            x: boss.x + Math.cos(crasherAngle) * (boss.radius + 20),
            y: boss.y + Math.sin(crasherAngle) * (boss.radius + 20),
            vx: Math.cos(crasherAngle) * 180,
            vy: Math.sin(crasherAngle) * 180,
            angle: crasherAngle,
            rotationSpeed: 0.08,
            sides: 3,
            radius: 14,
            color: "#F48FB1",
            health: 55,
            maxHealth: 55,
            damage: 30,
            xp: 75
          };
          this.shapes.set(crasherShape.id, crasherShape);
        }
      }
    }
  }
  updateProjectiles(dt, now) {
    for (const [id, proj] of this.projectiles.entries()) {
      if (now - proj.createdAt > proj.lifeTime || proj.health <= 0) {
        const owner = this.players.get(proj.ownerId);
        if (owner) {
          if (proj.type === "drone" || proj.type === "swarm") owner.dronesCount = Math.max(0, owner.dronesCount - 1);
          if (proj.type === "trap") owner.trapsCount = Math.max(0, owner.trapsCount - 1);
        }
        this.projectiles.delete(id);
        continue;
      }
      if (proj.type === "drone" || proj.type === "swarm") {
        const owner = this.players.get(proj.ownerId);
        if (owner && !owner.isDead) {
          let targetX = owner.input.mouseX;
          let targetY = owner.input.mouseY;
          if (owner.input.isRepellingDrones) {
            targetX = owner.x + (owner.x - targetX);
            targetY = owner.y + (owner.y - targetY);
          }
          const angleToTarget = Math.atan2(targetY - proj.y, targetX - proj.x);
          const droneSpeed = proj.type === "swarm" ? 440 : 340;
          proj.vx += Math.cos(angleToTarget) * 1200 * dt;
          proj.vy += Math.sin(angleToTarget) * 1200 * dt;
          const curr = Math.hypot(proj.vx, proj.vy);
          if (curr > droneSpeed) {
            proj.vx = proj.vx / curr * droneSpeed;
            proj.vy = proj.vy / curr * droneSpeed;
          }
          proj.angle = Math.atan2(proj.vy, proj.vx);
        } else {
          proj.vx *= 0.98;
          proj.vy *= 0.98;
        }
      } else if (proj.type === "trap") {
        proj.vx *= 0.88;
        proj.vy *= 0.88;
      }
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      const half = this.arenaSize / 2;
      if (Math.abs(proj.x) > half || Math.abs(proj.y) > half) {
        const owner = this.players.get(proj.ownerId);
        if (owner) {
          if (proj.type === "drone" || proj.type === "swarm") owner.dronesCount = Math.max(0, owner.dronesCount - 1);
          if (proj.type === "trap") owner.trapsCount = Math.max(0, owner.trapsCount - 1);
        }
        this.projectiles.delete(id);
      }
    }
  }
  updateShapes(dt) {
    for (const shape of this.shapes.values()) {
      if (shape.type === "crasher") {
        let nearestDist = 600;
        let target = null;
        for (const p of this.players.values()) {
          if (p.isDead) continue;
          const d = Math.hypot(p.x - shape.x, p.y - shape.y);
          if (d < nearestDist) {
            nearestDist = d;
            target = p;
          }
        }
        if (target) {
          const angle = Math.atan2(target.y - shape.y, target.x - shape.x);
          shape.vx += Math.cos(angle) * 350 * dt;
          shape.vy += Math.sin(angle) * 350 * dt;
          const speed = Math.hypot(shape.vx, shape.vy);
          if (speed > 220) {
            shape.vx = shape.vx / speed * 220;
            shape.vy = shape.vy / speed * 220;
          }
        }
      }
      shape.x += shape.vx * dt;
      shape.y += shape.vy * dt;
      shape.angle += shape.rotationSpeed;
      shape.vx *= 0.99;
      shape.vy *= 0.99;
      const half = this.arenaSize / 2 - shape.radius;
      if (shape.x < -half) {
        shape.x = -half;
        shape.vx *= -1;
      }
      if (shape.x > half) {
        shape.x = half;
        shape.vx *= -1;
      }
      if (shape.y < -half) {
        shape.y = -half;
        shape.vy *= -1;
      }
      if (shape.y > half) {
        shape.y = half;
        shape.vy *= -1;
      }
    }
  }
  // --- COLLISION RESOLUTION ---
  handleCollisions() {
    for (const [projId, proj] of this.projectiles.entries()) {
      for (const [shapeId, shape] of this.shapes.entries()) {
        const dist = Math.hypot(proj.x - shape.x, proj.y - shape.y);
        if (dist < proj.radius + shape.radius) {
          shape.health -= proj.damage;
          proj.health -= shape.damage * 0.7;
          shape.vx += proj.vx * 0.15;
          shape.vy += proj.vy * 0.15;
          if (shape.health <= 0) {
            this.handleShapeDestroyed(shape, proj.ownerId);
            this.shapes.delete(shapeId);
          }
          if (proj.health <= 0) {
            const owner = this.players.get(proj.ownerId);
            if (owner) {
              if (proj.type === "drone" || proj.type === "swarm") owner.dronesCount = Math.max(0, owner.dronesCount - 1);
              if (proj.type === "trap") owner.trapsCount = Math.max(0, owner.trapsCount - 1);
            }
            this.projectiles.delete(projId);
            break;
          }
        }
      }
    }
    for (const [projId, proj] of this.projectiles.entries()) {
      for (const p of this.players.values()) {
        if (p.isDead || p.id === proj.ownerId) continue;
        if (this.mode !== "ffa" && this.mode !== "maze" && this.mode !== "survival" && p.team === proj.team) continue;
        const tankDef = TANKS[p.tankId] || TANKS["basic"];
        const dist = Math.hypot(proj.x - p.x, proj.y - p.y);
        if (dist < proj.radius + tankDef.bodyRadius) {
          if (!p.isGodmode) {
            p.health -= proj.damage;
            p.lastDamageTime = Date.now();
            p.invisibility = 0;
          }
          p.vx += proj.vx * 0.08;
          p.vy += proj.vy * 0.08;
          proj.health -= 15 + p.stats.bodyDamage * 4;
          if (p.health <= 0 && !p.isGodmode) {
            this.handlePlayerKilled(p, proj.ownerId);
          }
          if (proj.health <= 0) {
            const owner = this.players.get(proj.ownerId);
            if (owner) {
              if (proj.type === "drone" || proj.type === "swarm") owner.dronesCount = Math.max(0, owner.dronesCount - 1);
              if (proj.type === "trap") owner.trapsCount = Math.max(0, owner.trapsCount - 1);
            }
            this.projectiles.delete(projId);
            break;
          }
        }
      }
    }
    for (const [projId, proj] of this.projectiles.entries()) {
      if (proj.team === "boss") continue;
      for (const [bossId, boss] of this.bosses.entries()) {
        const dist = Math.hypot(proj.x - boss.x, proj.y - boss.y);
        if (dist < proj.radius + boss.radius) {
          boss.health -= proj.damage;
          proj.health -= 40;
          if (boss.health <= 0) {
            this.handleBossDefeated(boss, proj.ownerId);
            this.bosses.delete(bossId);
          }
          if (proj.health <= 0) {
            const owner = this.players.get(proj.ownerId);
            if (owner) {
              if (proj.type === "drone" || proj.type === "swarm") owner.dronesCount = Math.max(0, owner.dronesCount - 1);
              if (proj.type === "trap") owner.trapsCount = Math.max(0, owner.trapsCount - 1);
            }
            this.projectiles.delete(projId);
            break;
          }
        }
      }
    }
    for (const p of this.players.values()) {
      if (p.isDead) continue;
      const tankDef = TANKS[p.tankId] || TANKS["basic"];
      for (const [shapeId, shape] of this.shapes.entries()) {
        const dist = Math.hypot(p.x - shape.x, p.y - shape.y);
        if (dist < tankDef.bodyRadius + shape.radius) {
          const bodyRamDamage = (24 + p.stats.bodyDamage * 14) * (tankDef.isRammer ? 1.7 : 1);
          shape.health -= bodyRamDamage;
          if (!p.isGodmode) {
            p.health -= shape.damage * 0.4;
            p.lastDamageTime = Date.now();
            p.invisibility = 0;
          }
          const angle = Math.atan2(shape.y - p.y, shape.x - p.x);
          p.vx -= Math.cos(angle) * 80;
          p.vy -= Math.sin(angle) * 80;
          shape.vx += Math.cos(angle) * 120;
          shape.vy += Math.sin(angle) * 120;
          if (shape.health <= 0) {
            this.handleShapeDestroyed(shape, p.id);
            this.shapes.delete(shapeId);
          }
          if (p.health <= 0 && !p.isGodmode) {
            this.handlePlayerKilled(p, `Shape (${shape.type})`);
          }
        }
      }
    }
    const playerArray = Array.from(this.players.values());
    for (let i = 0; i < playerArray.length; i++) {
      const p1 = playerArray[i];
      if (p1.isDead) continue;
      const tank1 = TANKS[p1.tankId] || TANKS["basic"];
      for (let j = i + 1; j < playerArray.length; j++) {
        const p2 = playerArray[j];
        if (p2.isDead) continue;
        if (this.mode !== "ffa" && this.mode !== "maze" && this.mode !== "survival" && p1.team === p2.team) continue;
        const tank2 = TANKS[p2.tankId] || TANKS["basic"];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (dist < tank1.bodyRadius + tank2.bodyRadius) {
          const dmg1 = (25 + p1.stats.bodyDamage * 16) * (tank1.isRammer ? 1.7 : 1);
          const dmg2 = (25 + p2.stats.bodyDamage * 16) * (tank2.isRammer ? 1.7 : 1);
          if (!p1.isGodmode) {
            p1.health -= dmg2 * 0.5;
            p1.lastDamageTime = Date.now();
            p1.invisibility = 0;
          }
          if (!p2.isGodmode) {
            p2.health -= dmg1 * 0.5;
            p2.lastDamageTime = Date.now();
            p2.invisibility = 0;
          }
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          p1.vx -= Math.cos(angle) * 160;
          p1.vy -= Math.sin(angle) * 160;
          p2.vx += Math.cos(angle) * 160;
          p2.vy += Math.sin(angle) * 160;
          if (p1.health <= 0 && !p1.isGodmode) this.handlePlayerKilled(p1, p2.id);
          if (p2.health <= 0 && !p2.isGodmode) this.handlePlayerKilled(p2, p1.id);
        }
      }
    }
  }
  handleShapeDestroyed(shape, killerId) {
    const killer = this.players.get(killerId);
    if (!killer) return;
    killer.score += shape.xp;
    killer.exp += shape.xp;
    killer.shapesDestroyed++;
    if (killer.tankId === "necromancer" && shape.type === "square" && killer.dronesCount < 24) {
      killer.dronesCount++;
      const squareDrone = {
        id: this.generateId("necro_sq"),
        ownerId: killer.id,
        ownerTeam: killer.team,
        x: shape.x,
        y: shape.y,
        vx: 0,
        vy: 0,
        radius: 12,
        color: "#FFE600",
        team: killer.team,
        type: "drone",
        angle: 0,
        damage: 26,
        health: 28,
        maxHealth: 28,
        createdAt: Date.now(),
        lifeTime: 45e3,
        shapeSides: 4
      };
      this.projectiles.set(squareDrone.id, squareDrone);
    }
    this.checkLevelUp(killer);
  }
  handlePlayerKilled(victim, killerIdOrName) {
    victim.isDead = true;
    let killerName = "Environment";
    let killerTank = "Hazard";
    let killerTeam = "neutral";
    const killer = this.players.get(killerIdOrName);
    if (killer) {
      killerName = killer.name;
      killerTank = (TANKS[killer.tankId] || TANKS["basic"]).name;
      killerTeam = killer.team;
      killer.killCount++;
      const bounty = Math.max(800, Math.floor(victim.score * 0.65));
      killer.score += bounty;
      killer.exp += bounty;
      this.checkLevelUp(killer);
    } else {
      killerName = killerIdOrName;
    }
    this.killFeed.unshift({
      id: this.generateId("kill"),
      killerName,
      killerTank,
      killerTeam,
      victimName: victim.name,
      victimTank: (TANKS[victim.tankId] || TANKS["basic"]).name,
      victimTeam: victim.team,
      timestamp: Date.now()
    });
    if (this.killFeed.length > 8) {
      this.killFeed.pop();
    }
    if (victim.ws && victim.ws.readyState === import_ws.WebSocket.OPEN) {
      const timeAliveSec = Math.floor((Date.now() - victim.spawnTime) / 1e3);
      victim.ws.send(JSON.stringify({
        type: "player_death",
        report: {
          killerName,
          killerTank,
          score: victim.score,
          level: victim.level,
          timeAliveSec,
          kills: victim.killCount,
          shapesDestroyed: victim.shapesDestroyed
        }
      }));
    }
    if (victim.isBot) {
      setTimeout(() => {
        this.players.delete(victim.id);
        this.spawnBot();
      }, 3500);
    }
  }
  handleBossDefeated(boss, killerId) {
    const killer = this.players.get(killerId);
    if (killer) {
      killer.score += 35e3;
      killer.exp += 35e3;
      this.checkLevelUp(killer);
    }
    this.killFeed.unshift({
      id: this.generateId("boss_kill"),
      killerName: killer ? killer.name : "Unknown Hero",
      killerTank: killer ? (TANKS[killer.tankId] || TANKS["basic"]).name : "Tank",
      killerTeam: killer ? killer.team : "neutral",
      victimName: boss.name,
      victimTank: "Mega Boss",
      victimTeam: "boss",
      timestamp: Date.now()
    });
  }
  respawnPlayer(id) {
    const p = this.players.get(id);
    if (!p) return null;
    const spawn = this.getSpawnPosition(p.team);
    p.x = spawn.x;
    p.y = spawn.y;
    p.vx = 0;
    p.vy = 0;
    p.isDead = false;
    p.health = 100;
    p.maxHealth = 100;
    const keptLevel = Math.max(1, Math.floor(p.level / 2));
    p.exp = LEVEL_EXP_TABLE[keptLevel - 1] || 0;
    p.score = p.exp;
    p.level = keptLevel;
    p.statPoints = keptLevel - 1;
    p.tankId = keptLevel >= 15 ? TANKS[p.tankId]?.tier === 2 ? p.tankId : "basic" : "basic";
    p.stats = {
      movementSpeed: 0,
      reload: 0,
      bulletDamage: 0,
      bulletPenetration: 0,
      bulletSpeed: 0,
      bodyDamage: 0,
      maxHealth: 0,
      healthRegen: 0
    };
    p.spawnTime = Date.now();
    p.dronesCount = 0;
    p.trapsCount = 0;
    return p;
  }
  checkLevelUp(p) {
    const newLevel = getLevelFromExp(p.exp);
    if (newLevel > p.level) {
      const addedPoints = newLevel - p.level;
      p.level = newLevel;
      p.statPoints += addedPoints;
    }
  }
  broadcastSnapshot() {
    const playerViews = [];
    const leaderEntries = [];
    for (const p of this.players.values()) {
      if (p.isDead) continue;
      const tankDef = TANKS[p.tankId] || TANKS["basic"];
      const availUpgrades = getAvailableUpgrades(p.tankId, p.level);
      playerViews.push({
        id: p.id,
        name: p.name,
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
        vx: Math.round(p.vx * 10) / 10,
        vy: Math.round(p.vy * 10) / 10,
        angle: Math.round(p.angle * 100) / 100,
        tankId: p.tankId,
        score: p.score,
        level: p.level,
        health: Math.round(p.health),
        maxHealth: Math.round(p.maxHealth),
        team: p.team,
        color: p.color,
        invisibility: Math.round(p.invisibility * 100) / 100,
        isDead: p.isDead,
        killCount: p.killCount,
        statPoints: p.statPoints,
        stats: p.stats,
        availableUpgrades: availUpgrades,
        recoilOffsets: p.recoilOffsets.map((r) => Math.round(r * 10) / 10),
        autoTurretAngles: p.autoTurretAngles ? p.autoTurretAngles.map((a) => Math.round(a * 100) / 100) : void 0,
        isBot: p.isBot,
        botTier: p.botTier,
        isGodmode: p.isGodmode,
        rainbowSkin: p.rainbowSkin,
        isJuggernaut: p.isJuggernaut
      });
      leaderEntries.push({
        id: p.id,
        name: p.name,
        score: p.score,
        level: p.level,
        tankName: tankDef.name,
        team: p.team,
        color: p.color,
        isPro: p.botTier === "pro"
      });
    }
    leaderEntries.sort((a, b) => b.score - a.score);
    const topLeaderboard = leaderEntries.slice(0, 10);
    const projViews = [];
    for (const proj of this.projectiles.values()) {
      projViews.push({
        id: proj.id,
        ownerId: proj.ownerId,
        x: Math.round(proj.x * 10) / 10,
        y: Math.round(proj.y * 10) / 10,
        vx: Math.round(proj.vx * 10) / 10,
        vy: Math.round(proj.vy * 10) / 10,
        radius: proj.radius,
        color: proj.color,
        team: proj.team,
        type: proj.type,
        angle: Math.round(proj.angle * 100) / 100,
        healthRatio: Math.max(0, Math.min(1, proj.health / proj.maxHealth)),
        shapeSides: proj.shapeSides
      });
    }
    const shapeViews = [];
    for (const shp of this.shapes.values()) {
      shapeViews.push({
        id: shp.id,
        type: shp.type,
        x: Math.round(shp.x * 10) / 10,
        y: Math.round(shp.y * 10) / 10,
        angle: Math.round(shp.angle * 100) / 100,
        sides: shp.sides,
        radius: shp.radius,
        color: shp.color,
        healthRatio: Math.max(0, Math.min(1, shp.health / shp.maxHealth))
      });
    }
    const bossViews = [];
    for (const boss of this.bosses.values()) {
      bossViews.push({
        id: boss.id,
        name: boss.name,
        x: Math.round(boss.x * 10) / 10,
        y: Math.round(boss.y * 10) / 10,
        angle: Math.round(boss.angle * 100) / 100,
        health: Math.round(boss.health),
        maxHealth: boss.maxHealth,
        radius: boss.radius,
        color: boss.color,
        bossType: boss.bossType
      });
    }
    const snapshot = {
      t: Date.now(),
      players: playerViews,
      projectiles: projViews,
      shapes: shapeViews,
      bosses: bossViews,
      walls: this.walls,
      leaderboard: topLeaderboard,
      arenaSize: this.arenaSize,
      mode: this.mode,
      zoneRadius: this.mode === "survival" ? this.zoneRadius : void 0
    };
    const payload = JSON.stringify({ type: "state_update", snapshot, killFeed: this.killFeed });
    for (const p of this.players.values()) {
      if (!p.isBot && p.ws && p.ws.readyState === import_ws.WebSocket.OPEN) {
        p.ws.send(payload);
      }
    }
  }
  broadcastChatMessage(sender, text) {
    const chat = {
      id: this.generateId("msg"),
      senderName: sender.name,
      senderTeam: sender.team,
      text: text.slice(0, 80),
      timestamp: Date.now()
    };
    const payload = JSON.stringify({ type: "chat_message", chat });
    for (const p of this.players.values()) {
      if (!p.isBot && p.ws && p.ws.readyState === import_ws.WebSocket.OPEN) {
        p.ws.send(payload);
      }
    }
  }
};

// server/game-engine.ts
var GameManager = class _GameManager {
  constructor() {
    this.rooms = /* @__PURE__ */ new Map();
    this.clientRoomMap = /* @__PURE__ */ new Map();
    this.initRooms();
  }
  static getInstance() {
    if (!_GameManager.instance) {
      _GameManager.instance = new _GameManager();
    }
    return _GameManager.instance;
  }
  initRooms() {
    const modes = ["ffa", "2tdm", "4tdm", "maze", "siege", "domination", "survival", "juggernaut", "sandbox"];
    for (const mode of modes) {
      const room = new GameRoom(`room_${mode}`, mode);
      room.start();
      this.rooms.set(mode, room);
    }
  }
  getRoom(mode) {
    let room = this.rooms.get(mode);
    if (!room) {
      room = new GameRoom(`room_${mode}`, mode);
      room.start();
      this.rooms.set(mode, room);
    }
    return room;
  }
  handleConnection(ws) {
    const clientId = `client_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        this.handleMessage(clientId, ws, msg);
      } catch (err) {
        console.error("Invalid WS packet:", err);
      }
    });
    ws.on("close", () => {
      this.handleDisconnect(clientId);
    });
    ws.on("error", (err) => {
      console.error(`WS error for ${clientId}:`, err);
      this.handleDisconnect(clientId);
    });
  }
  handleMessage(clientId, ws, msg) {
    switch (msg.type) {
      case "join": {
        const mode = msg.mode || "ffa";
        const name = msg.name || "Tank";
        const color = msg.color;
        this.handleDisconnect(clientId);
        const room = this.getRoom(mode);
        const player = room.addHumanPlayer(clientId, ws, name, color);
        this.clientRoomMap.set(clientId, { roomId: mode, playerId: clientId });
        ws.send(JSON.stringify({
          type: "init",
          payload: {
            selfId: player.id,
            arenaSize: room.arenaSize,
            mode: room.mode,
            walls: room.walls,
            team: player.team
          }
        }));
        break;
      }
      case "input": {
        const meta = this.clientRoomMap.get(clientId);
        if (!meta) return;
        const room = this.rooms.get(meta.roomId);
        if (room && msg.input) {
          room.handlePlayerInput(meta.playerId, msg.input);
        }
        break;
      }
      case "upgrade_stat": {
        const meta = this.clientRoomMap.get(clientId);
        if (!meta) return;
        const room = this.rooms.get(meta.roomId);
        if (room && msg.statKey) {
          room.handleStatUpgrade(meta.playerId, msg.statKey);
        }
        break;
      }
      case "upgrade_tank": {
        const meta = this.clientRoomMap.get(clientId);
        if (!meta) return;
        const room = this.rooms.get(meta.roomId);
        if (room && msg.tankId) {
          room.handleTankUpgrade(meta.playerId, msg.tankId);
        }
        break;
      }
      case "respawn": {
        const meta = this.clientRoomMap.get(clientId);
        if (!meta) return;
        const room = this.rooms.get(meta.roomId);
        if (room) {
          const respawned = room.respawnPlayer(meta.playerId);
          if (respawned) {
            ws.send(JSON.stringify({
              type: "respawn_success",
              selfId: respawned.id
            }));
          }
        }
        break;
      }
      case "chat": {
        const meta = this.clientRoomMap.get(clientId);
        if (!meta || !msg.text) return;
        const room = this.rooms.get(meta.roomId);
        if (room) {
          const player = room.players.get(meta.playerId);
          if (player) {
            room.broadcastChatMessage(player, msg.text);
          }
        }
        break;
      }
      case "sandbox_action": {
        const meta = this.clientRoomMap.get(clientId);
        if (!meta) return;
        const room = this.rooms.get(meta.roomId);
        if (room && room.mode === "sandbox") {
          room.handleSandboxAction(meta.playerId, msg.action, msg.data);
        }
        break;
      }
      case "cheat": {
        const meta = this.clientRoomMap.get(clientId);
        if (!meta) return;
        const room = this.rooms.get(meta.roomId);
        if (room && msg.code) {
          const feedback = room.handleCheatCode(meta.playerId, msg.code);
          ws.send(JSON.stringify({
            type: "cheat_feedback",
            message: feedback
          }));
        }
        break;
      }
      default:
        break;
    }
  }
  handleDisconnect(clientId) {
    const meta = this.clientRoomMap.get(clientId);
    if (!meta) return;
    const room = this.rooms.get(meta.roomId);
    if (room) {
      room.removePlayer(meta.playerId);
    }
    this.clientRoomMap.delete(clientId);
  }
  getRoomStats() {
    const stats = {};
    for (const [mode, room] of this.rooms.entries()) {
      let humans = 0;
      let bots = 0;
      for (const p of room.players.values()) {
        if (p.isBot) bots++;
        else humans++;
      }
      stats[mode] = { humanCount: humans, botCount: bots, mode };
    }
    return stats;
  }
};

// server.ts
var isProduction = process.env.NODE_ENV === "production";
var PORT = parseInt(process.env.PORT || "3000", 10);
async function startServer() {
  const app = (0, import_express.default)();
  app.use(import_express.default.json());
  const server = import_http.default.createServer(app);
  const gameManager = GameManager.getInstance();
  const wss = new import_ws2.WebSocketServer({ server });
  wss.on("connection", (ws) => {
    gameManager.handleConnection(ws);
  });
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });
  app.get("/api/rooms", (_req, res) => {
    res.json(gameManager.getRoomStats());
  });
  app.get("/api/download/exe", (_req, res) => {
    const exePath = import_path.default.resolve(process.cwd(), "arras-io-tank-arena.exe");
    if (import_fs.default.existsSync(exePath)) {
      res.setHeader("Content-Type", "application/vnd.microsoft.portable-executable");
      res.setHeader("Content-Disposition", 'attachment; filename="arras-io-tank-arena.exe"');
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.sendFile(exePath);
    } else {
      res.status(404).send("File not found");
    }
  });
  app.get("/api/download/windows-release", (_req, res) => {
    const winZipPath = import_path.default.resolve(process.cwd(), "arras-io-windows-release.zip");
    if (import_fs.default.existsSync(winZipPath)) {
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="arras-io-windows-edition.zip"');
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.sendFile(winZipPath);
    } else {
      res.status(404).send("File not found");
    }
  });
  app.get("/api/download-zip", (_req, res) => {
    const winZipPath = import_path.default.resolve(process.cwd(), "arras-io-windows-release.zip");
    const sourceZipPath = import_path.default.resolve(process.cwd(), "arras-io-game.zip");
    const finalPath = import_fs.default.existsSync(winZipPath) ? winZipPath : sourceZipPath;
    if (import_fs.default.existsSync(finalPath)) {
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="arras-io-windows-edition.zip"');
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.sendFile(finalPath);
    } else {
      res.status(404).send("File not found");
    }
  });
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true"
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.resolve(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Arras.io Tank Arena server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
