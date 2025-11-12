<template>
  <div class="my-2 w-full animate-fadeIn">
    <table
      class="hidden min-w-full overflow-auto text-left text-sm font-light md:table"
      cellspacing="0"
    >
      <thead class="border-b border-neutral-200 font-medium">
        <tr class="flex w-full animate-pulse justify-between py-3">
          <th
            v-for="head in Array.from({ length: 6 }, (_, i) => i + 1)"
            :key="head"
            class="mx-4 h-2 w-32 rounded bg-grey-200"
          ></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in Array.from({ length: 4 }, (_, i) => i + 1)"
          :key="row"
          class="flex w-full animate-pulse justify-between border-b border-neutral-200 py-4 last:border-none"
        >
          <td
            v-for="column in Array.from({ length: 6 }, (_, i) => i + 1)"
            :key="column"
            class="mx-4 h-2 w-32 rounded bg-grey-400"
          ></td>
        </tr>
      </tbody>
    </table>
    <BaseLoading class="block justify-center md:hidden" />
  </div>
</template>
