import type { NitroFetchRequest, $Fetch } from 'nitropack';

const RESOURCE = '/Statistics';

export const getStatisticsService = <T>(
  $fetch: $Fetch<T, NitroFetchRequest>,
) => ({
  async getDashboardStats(params: DashboardStatsParameters) {
    return $fetch<EventDashboardStats>(
      `${RESOURCE}/dashboard/${params.eventId}`,
      {
        method: 'GET',
        query: {
          range: params.range,
          from: params.from,
          to: params.to,
        },
      },
    );
  },
});
