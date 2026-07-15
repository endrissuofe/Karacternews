import * as migration_20260710_114013_initial_baseline from './20260710_114013_initial_baseline';
import * as migration_20260710_184202_increment_2_workflow_and_jobs from './20260710_184202_increment_2_workflow_and_jobs';
import * as migration_20260712_180255_increment_3_search from './20260712_180255_increment_3_search';
import * as migration_20260712_203512_increment_5_podcasts from './20260712_203512_increment_5_podcasts';
import * as migration_20260713_165736_increment_5_5_youtube from './20260713_165736_increment_5_5_youtube';
import * as migration_20260713_170112_increment_5_5_youtube_r2 from './20260713_170112_increment_5_5_youtube_r2';

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
    name: '20260712_180255_increment_3_search',
  },
  {
    up: migration_20260712_203512_increment_5_podcasts.up,
    down: migration_20260712_203512_increment_5_podcasts.down,
    name: '20260712_203512_increment_5_podcasts',
  },
  {
    up: migration_20260713_165736_increment_5_5_youtube.up,
    down: migration_20260713_165736_increment_5_5_youtube.down,
    name: '20260713_165736_increment_5_5_youtube',
  },
  {
    up: migration_20260713_170112_increment_5_5_youtube_r2.up,
    down: migration_20260713_170112_increment_5_5_youtube_r2.down,
    name: '20260713_170112_increment_5_5_youtube_r2'
  },
];
