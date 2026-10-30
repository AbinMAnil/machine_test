import { Page, Layout, Spinner } from "@shopify/polaris";
import { useQuery } from "react-query";
import { AnalyticsCard } from "../components";
import { fetchAnalytics } from "../services/timerApi";

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
    refetchOnWindowFocus: false,
  });

  return (
    <Page
      title="Storefront Impression Analytics"
      breadcrumbs={[{ content: "Dashboard", url: "/" }]}
    >
      <Layout>
        <Layout.Section>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <Spinner size="large" />
            </div>
          ) : (
            <AnalyticsCard analytics={data || {}} isLoading={isLoading} />
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
