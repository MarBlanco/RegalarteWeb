import * as migration_20260723_105205 from './20260723_105205';
import * as migration_20260730_020853 from './20260730_020853';
import * as migration_20260818_235549 from './20260818_235549';
import * as migration_20260819_011250 from './20260819_011250';
import * as migration_20260914_021915 from './20260914_021915';
import * as migration_20260916_215057 from './20260916_215057';
import * as migration_20260924_171820 from './20260924_171820';
import * as migration_20260925_195014 from './20260925_195014';
import * as migration_20260925_205311 from './20260925_205311';
import * as migration_20260925_234916 from './20260925_234916';
import * as migration_20260926_174732 from './20260926_174732';
import * as migration_20260927_132401 from './20260927_132401';
import * as migration_20261005_105342_admin_config from './20261005_105342_admin_config';
import * as migration_20261006_105706_navigation from './20261006_105706_navigation';

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
    name: '20260819_011250',
  },
  {
    up: migration_20260914_021915.up,
    down: migration_20260914_021915.down,
    name: '20260914_021915',
  },
  {
    up: migration_20260916_215057.up,
    down: migration_20260916_215057.down,
    name: '20260916_215057',
  },
  {
    up: migration_20260924_171820.up,
    down: migration_20260924_171820.down,
    name: '20260924_171820',
  },
  {
    up: migration_20260925_195014.up,
    down: migration_20260925_195014.down,
    name: '20260925_195014',
  },
  {
    up: migration_20260925_205311.up,
    down: migration_20260925_205311.down,
    name: '20260925_205311',
  },
  {
    up: migration_20260925_234916.up,
    down: migration_20260925_234916.down,
    name: '20260925_234916',
  },
  {
    up: migration_20260926_174732.up,
    down: migration_20260926_174732.down,
    name: '20260926_174732',
  },
  {
    up: migration_20260927_132401.up,
    down: migration_20260927_132401.down,
    name: '20260927_132401',
  },
  {
    up: migration_20261005_105342_admin_config.up,
    down: migration_20261005_105342_admin_config.down,
    name: '20261005_105342_admin_config',
  },
  {
    up: migration_20261006_105706_navigation.up,
    down: migration_20261006_105706_navigation.down,
    name: '20261006_105706_navigation'
  },
];
