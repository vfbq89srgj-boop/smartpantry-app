<!--
  Scanner icon: a receipt with an apple in front, inside a scan frame.
  Shows both ways to add food: photograph the receipt or the groceries themselves.
  Built from the Lucide icons "scan", "receipt" and "apple" so it matches the other icons.
  The apple is filled with the background colour (prop "cutout") so it covers the receipt behind it.
-->
<script setup lang="ts">
withDefaults(
  defineProps<{ size?: number; strokeWidth?: number; cutout?: string }>(),
  { size: 24, strokeWidth: 1.5, cutout: 'var(--color-primary)' },
)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true">
    <!-- scan frame corners -->
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <!-- receipt (scaled down; the stroke is scaled up so lines keep the same thickness) -->
    <g transform="translate(10.6 11) scale(0.52) translate(-12 -12)" :stroke-width="strokeWidth / 0.52">
      <path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z" />
      <path d="M15 8H9M15 12H9" />
    </g>
    <!-- apple in front -->
    <g transform="translate(14.8 15) scale(0.36) translate(-12 -12)" :stroke-width="strokeWidth / 0.36">
      <path d="M12 6.528V3a1 1 0 0 1 1-1h0" />
      <path
        :fill="cutout"
        d="M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21" />
    </g>
  </svg>
</template>
