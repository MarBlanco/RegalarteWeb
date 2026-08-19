import * as migration_20260723_105205 from './20260723_105205';
import * as migration_20260730_020853 from './20260730_020853';
import * as migration_20260818_235549 from './20260818_235549';
import * as migration_20260819_011250 from './20260819_011250';

export const migrations = [
  {
    up: migration_20260723_105205.up,
    down: migration_20260723_105205.down,
    name: '20260723_105205',
  },
  {
    up: migration_20260730_020853.up,
    down: migration_20260730_020853.down,
    name: '20260730_020853',
  },
  {
    up: migration_20260818_235549.up,
    down: migration_20260818_235549.down,
    name: '20260818_235549',
  },
  {
    up: migration_20260819_011250.up,
    down: migration_20260819_011250.down,
    name: '20260819_011250'
  },
];
