import * as migration_20260723_105205 from './20260723_105205';

export const migrations = [
  {
    up: migration_20260723_105205.up,
    down: migration_20260723_105205.down,
    name: '20260723_105205'
  },
];
