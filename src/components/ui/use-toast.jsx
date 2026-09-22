export function useToast() {
  return {
    toast: ({ title }) => {
      console.log("Toast:", title);
    },
  };
}