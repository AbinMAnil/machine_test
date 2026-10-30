import { useState } from "react";
import { Page, Layout } from "@shopify/polaris";
import { useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { TimerForm } from "../components";
import { createTimer } from "../services/timerApi";

export default function CreateTimerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState(null);

  const mutation = useMutation({
    mutationFn: (payload) => createTimer(payload),
    onSuccess: () => {
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

  return (
    <Page
      title="Create Countdown Timer"
      breadcrumbs={[{ content: "Dashboard", url: "/" }]}
    >
      <Layout>
        <Layout.Section>
          <TimerForm
            isSaving={mutation.isLoading}
            apiError={apiError}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/")}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
