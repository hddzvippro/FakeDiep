/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShapeDef, ShapeType } from './types.ts';

export const SHAPE_CONFIGS: Record<ShapeType, ShapeDef> = {
  egg: {
    type: 'egg',
    sides: 0, // circle
    radius: 10,
    maxHealth: 15,
    damage: 8,
    xp: 40,
    color: '#ECEFF1',
    strokeColor: '#B0BEC5',
  },
  square: {
    type: 'square',
    sides: 4,
    radius: 14,
    maxHealth: 26,
    damage: 10,
    xp: 90,
    color: '#FFE600',
    strokeColor: '#D4B800',
  },
  triangle: {
    type: 'triangle',
    sides: 3,
    radius: 17,
    maxHealth: 75,
    damage: 20,
    xp: 300,
    color: '#FC7676',
    strokeColor: '#D45050',
  },
  pentagon: {
    type: 'pentagon',
    sides: 5,
    radius: 24,
    maxHealth: 250,
    damage: 35,
    xp: 1100,
    color: '#768CFC',
    strokeColor: '#5368D8',
  },
  beta_pentagon: {
    type: 'beta_pentagon',
    sides: 5,
    radius: 42,
    maxHealth: 900,
    damage: 65,
    xp: 4500,
    color: '#657DF7',
    strokeColor: '#4358C9',
  },
  alpha_pentagon: {
    type: 'alpha_pentagon',
    sides: 5,
    radius: 75,
    maxHealth: 3800,
    damage: 110,
    xp: 35000,
    color: '#4960E6',
    strokeColor: '#2D41B8',
  },
  crasher: {
    type: 'crasher',
    sides: 3,
    radius: 13,
    maxHealth: 40,
    damage: 24,
    xp: 180,
    color: '#F48FB1',
    strokeColor: '#C2185B',
  },
};
