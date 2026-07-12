import * as migration_20260710_114013_initial_baseline from './20260710_114013_initial_baseline';
import * as migration_20260710_184202_increment_2_workflow_and_jobs from './20260710_184202_increment_2_workflow_and_jobs';
import * as migration_20260712_180255_increment_3_search from './20260712_180255_increment_3_search';

export const migrations = [
  {
    up: migration_20260710_114013_initial_baseline.up,
    down: migration_20260710_114013_initial_baseline.down,
    name: '20260710_114013_initial_baseline',
  },
  {
    up: migration_20260710_184202_increment_2_workflow_and_jobs.up,
    down: migration_20260710_184202_increment_2_workflow_and_jobs.down,
    name: '20260710_184202_increment_2_workflow_and_jobs',
  },
  {
    up: migration_20260712_180255_increment_3_search.up,
    down: migration_20260712_180255_increment_3_search.down,
    name: '20260712_180255_increment_3_search'
  },
];
