<script setup lang="ts">
import DesksList from './DesksList.vue';
import DesksMap from './DesksMap.vue';
type DeskTab = 'LIST' | 'MAP';

const activeTab = ref<DeskTab>('LIST');
const eventStore = useEventStore();
const { t } = useI18n();
</script>
<template>
  <BaseCard
    :title="t('desks.card_title')"
    :description="t('desks.card_description')"
  >
    <template #right-content>
      <BaseButton
        btn-type="outline-primary"
        btn-size="sm"
        :icon="eventStore.eventModeView ? 'hide' : 'view'"
        @click="eventStore.toggleEventMode()"
      >
        {{
          eventStore.eventModeView
            ? t('desks.event_mode_disable')
            : t('desks.event_mode_enable')
        }}
      </BaseButton>
    </template>

    <!-- Tabs -->
    <BaseTab>
      <BaseTabItem
        id="list"
        icon="dashboard-desks"
        :tab-position="1"
        :total-tabs="2"
        :is-active="activeTab === 'LIST'"
        class="w-full md:w-1/2"
        @click="activeTab = 'LIST'"
        >{{ t('desks.tab_list') }}</BaseTabItem
      >

      <BaseTabItem
        id="desks-map"
        icon="desks-map"
        :tab-position="2"
        :total-tabs="2"
        :is-active="activeTab === 'MAP'"
        class="w-full md:w-1/2"
        @click="activeTab = 'MAP'"
        >{{ t('desks.tab_map') }}</BaseTabItem
      >
    </BaseTab>

    <!-- Content -->
    <transition name="fade" mode="out-in">
      <component :is="activeTab === 'LIST' ? DesksList : DesksMap"></component>
    </transition>
  </BaseCard>
</template>
