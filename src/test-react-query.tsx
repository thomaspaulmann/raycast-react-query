import { Detail, LocalStorage, showToast, Toast } from "@raycast/api";
import fetch from "node-fetch";
import { notifyManager, QueryClient, useQuery } from "react-query";
import { createAsyncStoragePersister } from "react-query/createAsyncStoragePersister";
import { PersistQueryClientProvider } from "react-query/persistQueryClient";

type Data = {
  name: string;
  description: string;
  subscribers_count: number;
  stargazers_count: number;
  forks_count: number;
};

notifyManager.setBatchNotifyFunction(() => {
  // No-op
  return;
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => (await LocalStorage.getItem<string>(key)) ?? null,
    setItem: async (key, value) => LocalStorage.setItem(key, value),
    removeItem: async (key) => LocalStorage.removeItem(key),
  },
});

export default function Command() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <RepoDetails />
    </PersistQueryClientProvider>
  );
}

function RepoDetails() {
  const { data, error, isFetching, isLoading } = useQuery<Data, unknown>(["repo-details"], async () => {
    const response = await fetch("https://api.github.com/repos/tannerlinsley/react-query", {
      headers: { ContentType: "application/json" },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return (await response.json()) as Promise<Data>;
  });

  if (isLoading) {
    return <Detail isLoading />;
  }

  if (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Failed fetching repo details",
      message: error instanceof Error ? error.message : undefined,
    });
  }

  const markdown = data
    ? `
  # ${data.name}
  
  ${data.description}
  
  - 👀 ${data.subscribers_count}
  - ✨ ${data.stargazers_count}
  - 🍴 ${data.forks_count}
  `
    : undefined;

  return <Detail isLoading={isFetching} markdown={markdown} />;
}
