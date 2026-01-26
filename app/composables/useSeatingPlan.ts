import { getSeatingPlanService } from '~/services/seatingPlanService';

type UseSeatingPlanOptions = {
  immediate?: boolean;
  cacheMinutes?: number; // default 20
};

export const useSeatingPlan = async (
  eventId: number,
  options: UseSeatingPlanOptions = {},
) => {
  const seatingPlan = useState<SeatingPlan | null>(
    `seating-plan-${eventId}`,
    () => null,
  );

  const nuxtApp = useNuxtApp();
  const service = getSeatingPlanService(nuxtApp.$api);

  const key = `seating-plan-event-${eventId}`;
  const cacheMinutes = options.cacheMinutes ?? 20;

  const { data, refresh, status, error } = await useAsyncData(
    key,
    () => service.getOrCreateByEvent(eventId),
    {
      immediate: options.immediate ?? true,
      default: () => null,
      transform(input: SeatingPlan | null) {
        if (!input) return null;
        return {
          ...input,
          fetchedAt: new Date(),
        };
      },
      getCachedData(key) {
        const cached = nuxtApp.payload.data[key] || nuxtApp.static.data[key];
        if (!cached) return;
        if (!cached.fetchedAt || cacheExpired(cached.fetchedAt, cacheMinutes))
          return;
        return cached;
      },
    },
  );

  watchEffect(() => {
    if (data.value) {
      seatingPlan.value = data.value;
    }
  });

  const setDeskLayoutLocal = (deskId: number, patch: Partial<DeskLayout>) => {
    if (!seatingPlan.value) return;

    const layouts = (seatingPlan.value.deskLayouts ?? []) as DeskLayout[];
    const existing = layouts.find((l) => l.deskId === deskId);

    if (existing) {
      Object.assign(existing, patch);
    } else {
      layouts.push({
        deskId,
        x: patch.x ?? 60,
        y: patch.y ?? 60,
        rotation: patch.rotation ?? 0,
        shape: patch.shape ?? 'round',
        width: patch.width ?? 140,
        height: patch.height ?? 140,
        locked: patch.locked ?? false,
      } as DeskLayout);
    }

    seatingPlan.value.deskLayouts = layouts;
  };

  const refreshSeatingPlan = async (opts?: { force?: boolean }) => {
    if (opts?.force) {
      clearNuxtData(key);
    }
    await refresh();
  };

  const updateCanvas = async (
    planId: number,
    payload: UpdateSeatingPlanCanvas,
  ) => {
    if (!seatingPlan.value) return null;

    // optimistic
    seatingPlan.value.canvasWidth = payload.canvasWidth;
    seatingPlan.value.canvasHeight = payload.canvasHeight;

    const updated = await service.updateCanvas(planId, payload);
    seatingPlan.value = { ...(seatingPlan.value as SeatingPlan), ...updated };
    return updated;
  };

  const upsertDeskLayout = async (
    planId: number,
    deskId: number,
    payload: UpsertDeskLayout,
  ) => {
    setDeskLayoutLocal(deskId, payload); // optimistic
    const updated = await service.upsertDeskLayout(planId, deskId, payload);
    setDeskLayoutLocal(deskId, updated); // normalize
    return updated;
  };

  const addItem = async (planId: number, payload: UpsertSeatingPlanItem) => {
    const created = await service.addItem(planId, payload);
    if (seatingPlan.value) {
      seatingPlan.value.items = [...(seatingPlan.value.items ?? []), created];
    }
    return created;
  };

  const updateItem = async (
    planId: number,
    itemId: number,
    payload: UpsertSeatingPlanItem,
  ) => {
    const updated = await service.updateItem(planId, itemId, payload);
    if (!seatingPlan.value) return updated;

    seatingPlan.value.items = (seatingPlan.value.items ?? []).map((i) =>
      i.id === itemId ? updated : i,
    );
    return updated;
  };

  const deleteItem = async (planId: number, itemId: number) => {
    const res = await service.deleteItem(planId, itemId);
    if (res?.success && seatingPlan.value) {
      seatingPlan.value.items = (seatingPlan.value.items ?? []).filter(
        (i) => i.id !== itemId,
      );
    }
    return res;
  };

  return {
    seatingPlan,
    error,
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',

    refreshSeatingPlan,

    updateCanvas,
    upsertDeskLayout,
    addItem,
    updateItem,
    deleteItem,
  };
};
