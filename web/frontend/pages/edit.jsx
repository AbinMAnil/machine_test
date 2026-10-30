import { useState } from "react";
import { Page, Layout, Spinner, Card, Text } from "@shopify/polaris";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TimerForm } from "../components";
import { fetchTimer, updateTimer } from "../services/timerApi";

export default function EditTimerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const queryClient = useQueryClient();

  const [apiError, setApiError] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["timer", id],
    queryFn: () => fetchTimer(id),
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: (payload) => updateTimer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["timer", id]);
      queryClient.invalidateQueries(["timers"]);
      queryClient.invalidateQueries(["all-timers"]);
      queryClient.invalidateQueries(["analytics"]);
      navigate("/");
    },
    onError: (err) => {
      setApiError(err);
    },
  });

  const handleSubmit = (formData) => {
    setApiError(null);
    mutation.mutate(formData);
  };

  if (!id) {
    return (
      <Page title="Timer Not Found" breadcrumbs={[{ content: "Dashboard", url: "/" }]}>
        <Card sectioned>
          <Text as="p" color="critical">
            Missing timer ID parameter.
          </Text>
        </Card>
      </Page>
    );
  }

  if (isLoading) {
    return (
      <Page title="Loading Timer..." breadcrumbs={[{ content: "Dashboard", url: "/" }]}>
        <div style={{ textAlign: "center", padding: "60px" }}>
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  if (error || !data?.timer) {
    return (
      <Page title="Timer Not Found" breadcrumbs={[{ content: "Dashboard", url: "/" }]}>
        <Card sectioned>
          <Text as="p" color="critical">
            Could not find the requested timer. It may have been deleted.
          </Text>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title={`Edit: ${data.timer.name}`}
      breadcrumbs={[{ content: "All Timers", url: "/timers" }]}
    >
      <Layout>
        <Layout.Section>
          <TimerForm
            initialData={data.timer}
            isSaving={mutation.isLoading}
            apiError={apiError}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/timers")}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
