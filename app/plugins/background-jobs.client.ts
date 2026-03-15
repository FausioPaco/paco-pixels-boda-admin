export default defineNuxtPlugin(() => {
  const backgroundJobs = useBackgroundJobsStore();
  backgroundJobs.hydrateAndResume();
});
