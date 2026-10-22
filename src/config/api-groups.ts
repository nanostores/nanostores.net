import type { ApiGroup } from '../lib/api-reference'

// The single API page and its table of contents show exports in this order.
// It follows the README guide: the store constructors first, low-level
// events and deprecated exports last. Every export of `nanostores` must be
// listed once; `src/lib/api-reference.test.ts` and the build check it.
export const apiGroups: ApiGroup[] = [
  {
    label: 'Main',
    names: ['atom', 'map', 'computed', 'batched', 'effect', 'batch'],
  },
  {
    label: 'Lifecycle',
    names: ['onMount', 'STORE_UNMOUNT_DELAY'],
  },
  {
    label: 'Map helpers',
    names: ['listenKeys', 'subscribeKeys', 'setPath', 'getPath', 'setByKey'],
  },
  {
    label: 'Tasks & testing',
    names: [
      'task',
      'startTask',
      'allTasks',
      'cleanTasks',
      'keepMount',
      'cleanStores',
      'clean',
    ],
  },
  {
    label: 'Advanced',
    names: [
      'onStart',
      'onStop',
      'onSet',
      'onNotify',
      'mapCreator',
      'readonlyType',
    ],
  },
  {
    label: 'Types',
    names: [
      'ReadableAtom',
      'WritableAtom',
      'MapStore',
      'Task',
      'PreinitializedWritableAtom',
      'PreinitializedMapStore',
      'MapCreator',
      'Store',
      'WritableStore',
      'AnyStore',
      'Atom',
      'ListenableStore',
      'Gettable',
      'StoreValue',
      'StoreValues',
      'MapStoreKeys',
      'DeepMapStore',
      'BaseDeepMap',
      'AllPaths',
      'FromPath',
    ],
  },
  {
    label: 'Deprecated',
    names: ['deepMap', 'getKey'],
  },
]
