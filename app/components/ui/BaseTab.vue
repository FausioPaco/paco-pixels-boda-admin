<template>
  <section class="mt-6 overflow-hidden" aria-multiselectable="false">
    <ul
      class="items-between md:border-b-grey-100 flex w-full flex-col gap-y-3 md:flex-row md:justify-around md:gap-x-3 md:gap-y-0 md:border-b"
      role="tablist"
    >
      <slot></slot>
    </ul>
  </section>
</template>
