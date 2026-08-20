<template>
  <!-- Modals on this layout are owned by the page, which holds the campaign data. -->
  <div class="min-h-screen bg-muted">
    <div class="relative mx-auto min-h-screen max-w-md bg-default sm:shadow-xl">
      <slot />
    </div>
  </div>
</template>
