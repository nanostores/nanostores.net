<!-- #region show -->
<script setup lang="ts">
// #endregion
import { useStore } from '@nanostores/vue'
import { $cart, addItem, type Product } from './cart'

const { product } = defineProps<{ product: Product }>()
// #region show
const cart = useStore($cart)
</script>

<template>
  <button @click="addItem(product)">Add ({{ cart.length }})</button>
</template>
<!-- #endregion -->
