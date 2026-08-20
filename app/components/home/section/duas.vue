<script setup lang="ts">
import { getListDua } from "~/services/dua"

const { run } = getListDua({ query: { size: 8 } })
const { data, status } = run()

const duas = computed(() => data.value?.data ?? [])
</script>

<template>
  <section v-if="status === 'pending' || duas.length" class="pt-7">
    <HomeSectionHeader title="Doa dari donatur" />

    <div v-if="status === 'pending'" class="rail">
      <div
        v-for="n in 2"
        :key="n"
        class="w-[80vw] max-w-[320px] shrink-0 rounded-2xl border border-default p-4"
      >
        <div class="flex items-start gap-3">
          <USkeleton class="size-10 shrink-0 rounded-full" />
          <div class="flex-1">
            <USkeleton class="h-4 w-1/3" />
            <USkeleton class="mt-3 h-3 w-full" />
            <USkeleton class="mt-2 h-3 w-2/3" />
          </div>
        </div>
      </div>
    </div>

    <ul v-else class="rail">
      <li
        v-for="dua in duas"
        :key="dua.id"
        class="w-[80vw] max-w-[320px] shrink-0 snap-start"
      >
        <DuaCard :dua="dua" show-campaign />
      </li>
    </ul>
  </section>
</template>
