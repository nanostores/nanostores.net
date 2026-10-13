import { defineConfig } from 'vite'
import { nanostoresDevtools } from 'nanostores-devtools/vite'

// #region show
export default defineConfig({
  plugins: [nanostoresDevtools()],
})
// #endregion
