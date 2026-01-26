import { seatingPlanService } from '~/services/seatingPlanService';

type UseSeatingPlanOptions = {
  immediate?: boolean;
};

export function useSeatingPlan(
  eventId: number,
  options: UseSeatingPlanOptions = {},
) {
  const key = `seating-plan:event:${eventId}`;

  const { data, pending, error, refresh } = useAsyncData<SeatingPlan>(
    key,
    () => seatingPlanService.getOrCreateByEvent(eventId),
    { immediate: options.immediate ?? true },
  );

  const setDeskLayoutLocal = (deskId: number, patch: Partial<DeskLayout>) => {
    if (!data.value) return;

    const layouts = (data.value.deskLayouts ?? []) as DeskLayout[];
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

    data.value.deskLayouts = layouts;
  };

  const upsertDeskLayout = async (
    planId: number,
    deskId: number,
    payload: UpsertDeskLayout,
  ) => {
    // optimistic
    setDeskLayoutLocal(deskId, payload);
    const updated = await seatingPlanService.upsertDeskLayout(
      planId,
      deskId,
      payload,
    );

    // normaliza com a resposta do backend
    setDeskLayoutLocal(deskId, updated);
    return updated;
  };

  const updateCanvas = async (
    planId: number,
    payload: UpdateSeatingPlanCanvas,
  ) => {
    if (!data.value) return null;
    // optimistic
    data.value.canvasWidth = payload.canvasWidth;
    data.value.canvasHeight = payload.canvasHeight;

    const updated = await seatingPlanService.updateCanvas(planId, payload);
    data.value = { ...data.value, ...updated };
    return updated;
  };

  const addItem = async (planId: number, payload: UpsertSeatingPlanItem) => {
    const created = await seatingPlanService.addItem(planId, payload);
    if (data.value) data.value.items = [...(data.value.items ?? []), created];
    return created;
  };

  const updateItem = async (
    planId: number,
    itemId: number,
    payload: UpsertSeatingPlanItem,
  ) => {
    const updated = await seatingPlanService.updateItem(
      planId,
      itemId,
      payload,
    );
    if (!data.value) return updated;

    data.value.items = (data.value.items ?? []).map((i) =>
      i.id === itemId ? updated : i,
    );
    return updated;
  };

  const deleteItem = async (planId: number, itemId: number) => {
    const res = await seatingPlanService.deleteItem(planId, itemId);
    if (res?.success && data.value) {
      data.value.items = (data.value.items ?? []).filter(
        (i) => i.id !== itemId,
      );
    }
    return res;
  };

  return {
    seatingPlan: data,
    pending,
    error,
    refresh,

    updateCanvas,
    upsertDeskLayout,
    addItem,
    updateItem,
    deleteItem,
  };
}
