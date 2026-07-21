<script setup lang="ts">
import { RouterView } from 'vue-router';
import NavBar from '../components/NavBar.vue';
import ErrorBoundary from '../components/ErrorBoundary.vue';
</script>

<template>
  <NavBar />
  <ErrorBoundary>
    <RouterView />
  </ErrorBoundary>
</template>

