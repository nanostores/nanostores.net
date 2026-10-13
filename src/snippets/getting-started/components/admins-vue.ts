// #region show
import { useStore } from '@nanostores/vue'
import { $admins } from '../stores/admins'

const admins = useStore($admins)
// #endregion
export { admins }
