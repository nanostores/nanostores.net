<!-- #region show -->
<script setup lang="ts">
// #endregion
import { $session } from './session'
// #region show
import { useStore } from '@nanostores/vue'
const session = useStore($session)
</script>

<template>
  <span>{{ session?.name ?? 'Guest' }}</span>
</template>
<!-- #endregion -->
