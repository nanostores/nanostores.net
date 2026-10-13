<!-- #region show -->
<script lang="ts">
  // `$` is reserved here, so the store is renamed on import.
  import { $session as session } from './session'
</script>

<span>{$session?.name ?? 'Guest'}</span>
<!-- #endregion -->
