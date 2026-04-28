<script lang="ts" setup>
const { t } = useI18n();
const { eventId } = useEventStore();
const queryParameters = reactive<UserParameters>({
  eventId: Number(eventId!),
  searchQuery: '',
  startDate: '',
  endDate: '',
  pageNumber: 1,
  pageSize: 8,
});

const { users, pagination, isRefreshing, isError, refreshUsers } =
  await useUsersList(queryParameters);
const { isAdministrator, isSuperAdministrator } = useAuthStore();

const searchQuery = ref('');
const showFormModal = ref<boolean>(false);
const showRemoveModal = ref<boolean>(false);
const showPasswordModal = ref<boolean>(false);
const userSelected = ref<User | undefined>(undefined);

const debouncedSearch = useDebounceFn(() => {
  queryParameters.searchQuery = searchQuery.value;
  queryParameters.pageNumber = 1;
}, 600);

watch(searchQuery, () => {
  debouncedSearch();
});

watch(queryParameters, () => {
  refreshUsers({ force: true });
});

function onPageChange(newPage: number) {
  queryParameters.pageNumber = newPage;
}

function onPageSelected(newPage: number) {
  queryParameters.pageNumber = newPage;
}

const isFirstTime = computed(
  () =>
    !isRefreshing &&
    !isError &&
    users.value.length === 0 &&
    searchQuery.value === '',
);

const addUser = () => {
  userSelected.value = undefined;
  showFormModal.value = true;
};

const updateUser = (user: User) => {
  userSelected.value = user;
  showFormModal.value = true;
};

const removeUser = (user: User) => {
  userSelected.value = user;
  showRemoveModal.value = true;
};

const updatePassword = (user: User) => {
  userSelected.value = user;
  showPasswordModal.value = true;
};

const reloadUsers = () => {
  userSelected.value = undefined;
  refreshUsers({ force: true });
};

onMounted(() => {
  refreshUsers({ force: true });
});
</script>
<template>
  <BaseCard
    :title="t('users.card_title')"
    :description="t('users.card_description')"
  >
    <section
      id="users"
      class="relative flex min-h-[450px] w-full flex-col items-center px-4 py-5"
    >
      <div
        class="flex min-w-full max-w-full flex-col items-stretch justify-stretch"
      >
        <!-- Filters & Counter -->
        <div
          class="flex w-full animate-fadeIn flex-col md:flex-row md:justify-between"
        >
          <div class="w-full md:w-1/2">
            <BaseInput
              id="userName"
              v-model="searchQuery"
              autocomplete="name"
              type="search"
              name="userName"
              :label="t('users.search_label')"
              :placeholder="t('users.search_placeholder')"
              :readonly="isRefreshing"
            />

            <!-- Counter & Limit -->
            <div v-if="!isRefreshing" class="flex items-center justify-between">
              <div class="my-4 flex items-center space-x-2">
                <icon-funnel
                  :font-controlled="false"
                  class="text-primary-700 block h-7 w-7"
                ></icon-funnel>
                <h3 class="text-primary-700 text-2xl font-bold">
                  {{
                    pagination?.totalCount === 1
                      ? t('users.count_one')
                      : t('users.count_other', {
                          n: pagination ? pagination.totalCount : 0,
                        })
                  }}
                </h3>
              </div>
            </div>
          </div>

          <div
            class="flex w-full flex-col justify-start gap-4 md:w-1/2 md:flex-row md:items-end md:justify-end md:gap-2 md:pt-5"
          >
            <BaseButton
              icon="add"
              size="md"
              btn-type="primary"
              @click.prevent="addUser"
            >
              {{ t('users.add') }}
            </BaseButton>
          </div>
        </div>

        <!-- Loading -->
        <BaseTableLoading v-if="isRefreshing" class="hidden md:block" />

        <BaseLoading
          v-if="isRefreshing"
          size="lg"
          orientation="vertical"
          class="block md:hidden"
        />

        <!-- SearchNotFound -->
        <BaseSearchNotFound
          v-if="!isFirstTime && users.length === 0"
          @fallback="refreshUsers({ force: true })"
        >
          {{ t('users.not_found') }}
        </BaseSearchNotFound>

        <!-- No user: first Time -->
        <LazyBaseFirstEmptyState
          v-if="isFirstTime"
          icon="icon-account"
          :title="t('users.empty_title')"
          :description="t('users.empty_description')"
          :show-button="isAdministrator || isSuperAdministrator"
          :button-label="t('users.empty_button')"
          button-icon="add"
          @action="showFormModal = true"
        />

        <!-- Data -->
        <BaseTable
          v-if="!isRefreshing && !isError && users.length > 0"
          summary="Tabela sobre a lista de utilizadores"
        >
          <template #thead>
            <tr>
              <th scope="col">{{ t('users.table_name') }}</th>
              <th scope="col">{{ t('users.table_email') }}</th>
              <th scope="col">{{ t('users.table_role') }}</th>
              <th scope="col">{{ t('users.table_status') }}</th>
              <th scope="col">{{ t('users.table_password') }}</th>
              <th scope="col">{{ t('users.table_actions') }}</th>
            </tr>
          </template>
          <template #tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.roleName }}</td>
              <td>
                <UserStatusBadge
                  :is-online="user.isOnline"
                  :last-activity-at="user.lastActivityAt"
                />
              </td>
              <td>
                <BaseButton
                  v-if="isAdministrator || isSuperAdministrator"
                  size="sm"
                  btn-type="outline-primary"
                  @click.prevent="updatePassword(user)"
                >
                  {{ t('users.change_password') }}
                </BaseButton>
              </td>
              <td>
                <div class="flex space-x-2">
                  <BaseButton
                    v-if="isAdministrator || isSuperAdministrator"
                    size="sm"
                    btn-type="primary"
                    @click.prevent="updateUser(user)"
                  >
                    {{ t('users.edit') }}
                  </BaseButton>

                  <BaseButton
                    v-if="isAdministrator || isSuperAdministrator"
                    size="sm"
                    btn-type="outline-primary"
                    @click.prevent="removeUser(user)"
                  >
                    {{ t('users.remove') }}
                  </BaseButton>
                </div>
              </td>
            </tr>
          </template>
        </BaseTable>

        <!-- Pagination -->
        <BasePagination
          v-if="pagination && pagination.totalPages > 1"
          :pagination-data="pagination"
          @page-change="onPageChange"
          @page-selected="onPageSelected"
        />
      </div>

      <!-- Modals -->
      <LazyUsersFormModal
        :show="showFormModal"
        :user="userSelected"
        @close-modal="showFormModal = false"
        @success="reloadUsers"
      />

      <LazyUsersRemoveModal
        :show="showRemoveModal"
        :user="userSelected"
        @close-modal="showRemoveModal = false"
        @success="reloadUsers"
      />

      <LazyUsersResetPasswordModal
        :show="showPasswordModal"
        :user="userSelected"
        @close-modal="showPasswordModal = false"
        @reload="reloadUsers"
      />
    </section>
  </BaseCard>
</template>
