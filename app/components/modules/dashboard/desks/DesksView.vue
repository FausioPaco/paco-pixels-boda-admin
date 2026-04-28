<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth';

interface DeskViewProps {
  desk: Desk;
}

const props = defineProps<DeskViewProps>();

const showFormModal = ref<boolean>(false);
const showRemoveModal = ref<boolean>(false);
const { isAdministrator, isSuperAdministrator } = useAuthStore();
const { refreshDesk } = await useDesk(props.desk.id);
const { t } = useI18n();

const getAvaliablePlaces = computed(() => {
  return props.desk.seats_Limit - props.desk.seats_Filled;
});

const guestsPeopleCount = computed(() => {
  if (props.desk.guests == null) return 0;

  return props.desk.guests.reduce((accumulator: number, guest) => {
    return accumulator + guest.people_Count;
  }, 0);
});
</script>
<template>
  <BaseCard
    :title="desk.name"
    :description="t('desks.view_description')"
    back-link="/admin/mesas"
  >
    <div
      class="flex w-full animate-fadeIn flex-col px-3 md:flex-row md:justify-between"
    >
      <!-- Desk Info -->
      <div class="md:w-1/2">
        <BaseDescriptionList>
          <BaseDescriptionListItem
            :title="t('desks.detail_name')"
            :description="desk.name"
          />
          <BaseDescriptionListItem
            :title="t('desks.detail_people_count')"
            :description="
              desk.seats_Limit == 1
                ? t('desks.person_one')
                : t('desks.person_other', { n: desk.seats_Limit })
            "
          />

          <BaseDescriptionListItem
            :title="t('desks.detail_seats_filled')"
            :description="
              desk.seats_Limit == 1
                ? t('desks.person_one')
                : t('desks.seat_other', { n: props.desk?.seats_Filled })
            "
          />
          <BaseDescriptionListItem
            :title="t('desks.detail_seats_available')"
            :description="
              getAvaliablePlaces == 1
                ? t('desks.person_one')
                : t('desks.seat_other', { n: getAvaliablePlaces })
            "
          />
        </BaseDescriptionList>

        <div
          v-if="isAdministrator || isSuperAdministrator"
          class="my-4 flex items-center space-x-2"
        >
          <BaseButton
            type="button"
            size="sm"
            btn-type="outline-primary"
            icon="pencil"
            @click="showFormModal = true"
          >
            {{ t('common.edit') }}
          </BaseButton>

          <BaseButton
            type="button"
            size="sm"
            btn-type="outline-primary"
            class="flex items-center space-x-1"
            icon="cancel"
            @click="showRemoveModal = true"
          >
            {{ t('common.remove') }}
          </BaseButton>
        </div>
      </div>

      <!-- Desk Guests -->
      <LazyDesksTableView
        v-if="desk"
        :desk-name="desk.name"
        :guests="desk.guests"
        :people-count="guestsPeopleCount"
      />

      <LazyDesksFormModal
        v-if="desk"
        :show="showFormModal"
        :desk="desk"
        @close-modal="showFormModal = false"
        @success="refreshDesk({ force: true })"
      />

      <LazyDesksRemoveModal
        :show="showRemoveModal"
        :desk="desk"
        @close-modal="showRemoveModal = false"
        @success="$router.push('/admin/mesas')"
      />
    </div>
  </BaseCard>
</template>
