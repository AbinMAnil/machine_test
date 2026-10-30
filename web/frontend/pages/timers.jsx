import { useState } from "react";
import { Page, Layout, Banner } from "@shopify/polaris";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { TimerList } from "../components";
import {
  fetchTimers,
  patchTimerStatus,
  deleteTimer,
} from "../services/timerApi";

export default function TimersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["all-timers", statusFilter, searchQuery],
    queryFn: () =>
      fetchTimers({
        status: statusFilter,
        search: searchQuery,
        limit: 100,
      }),
    refetchOnWindowFocus: false,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => patchTimerStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(["all-timers"]);
      queryClient.invalidateQueries(["timers"]);
      queryClient.invalidateQueries(["analytics"]);
      setToastMessage("Status updated successfully");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTimer(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["all-timers"]);
      queryClient.invalidateQueries(["timers"]);
      queryClient.invalidateQueries(["analytics"]);
      setToastMessage("Timer deleted successfully");
    },
  });

  const handleToggleStatus = (id, newStatus) => {
    statusMutation.mutate({ id, status: newStatus });
  };

  const handleDeleteTimer = (id) => {
    return deleteMutation.mutateAsync(id);
  };

  const timers = data?.timers || [];

  return (
    <Page
      title="All Countdown Timers"
      breadcrumbs={[{ content: "Dashboard", url: "/" }]}
      primaryAction={{
        content: "Create New Timer",
        onAction: () => navigate("/create"),
      }}
    >
      <Layout>
        {toastMessage && (
          <Layout.Section>
            <Banner status="success" onDismiss={() => setToastMessage(null)}>
              <p>{toastMessage}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <TimerList
            timers={timers}
            isLoading={isLoading}
            statusFilter={statusFilter}
            searchQuery={searchQuery}
            onStatusFilterChange={setStatusFilter}
            onSearchChange={setSearchQuery}
            onToggleStatus={handleToggleStatus}
            onDeleteTimer={handleDeleteTimer}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
