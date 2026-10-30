import { useState } from "react";
import { Page, Layout, Banner, Stack, Button, Card, Text } from "@shopify/polaris";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { DashboardStats, TimerList } from "../components";
import {
  fetchTimers,
  fetchAnalytics,
  patchTimerStatus,
  deleteTimer,
} from "../services/timerApi";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  // Load analytics summary
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
    refetchOnWindowFocus: false,
  });

  // Load timers
  const {
    data: timersData,
    isLoading: isLoadingTimers,
    refetch: refetchTimers,
  } = useQuery({
    queryKey: ["timers", statusFilter, searchQuery],
    queryFn: () =>
      fetchTimers({
        status: statusFilter,
        search: searchQuery,
        limit: 10,
      }),
    refetchOnWindowFocus: false,
  });

  // Toggle active/paused
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => patchTimerStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(["timers"]);
      queryClient.invalidateQueries(["analytics"]);
      setToastMessage("Timer status updated successfully");
    },
  });

  // Delete timer
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTimer(id),
    onSuccess: () => {
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

  const timers = timersData?.timers || [];
  const summary = analyticsData?.summary || {};

  return (
    <Page
      title="Countdown Timer + Analytics"
      primaryAction={{
        content: "Create Countdown Timer",
        onAction: () => navigate("/create"),
      }}
      secondaryActions={[
        {
          content: "View All Timers",
          onAction: () => navigate("/timers"),
        },
        {
          content: "Analytics Details",
          onAction: () => navigate("/analytics"),
        },
      ]}
    >
      <Layout>
        {toastMessage && (
          <Layout.Section>
            <Banner
              status="success"
              onDismiss={() => setToastMessage(null)}
            >
              <p>{toastMessage}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Top Summary Cards */}
        <Layout.Section>
          <DashboardStats
            summary={summary}
            onCreateClick={() => navigate("/create")}
          />
        </Layout.Section>

        {/* Recent Timers List */}
        <Layout.Section>
          <Stack distribution="equalSpacing" alignment="center">
            <Text variant="headingMd" as="h3">
              Recent Countdown Timers
            </Text>
            {timers.length > 0 && (
              <Button plain onClick={() => navigate("/timers")}>
                View all timers &rarr;
              </Button>
            )}
          </Stack>

          <div style={{ marginTop: "12px" }}>
            <TimerList
              timers={timers}
              isLoading={isLoadingTimers}
              statusFilter={statusFilter}
              searchQuery={searchQuery}
              onStatusFilterChange={setStatusFilter}
              onSearchChange={setSearchQuery}
              onToggleStatus={handleToggleStatus}
              onDeleteTimer={handleDeleteTimer}
            />
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
