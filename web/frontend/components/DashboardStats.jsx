import { Card, Layout, Text, Stack, Badge, Button } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

export function DashboardStats({ summary = {}, onCreateClick }) {
  const navigate = useNavigate();

  const stats = [
    {
      title: "Total Timers",
      value: summary.totalTimers ?? 0,
      badge: <Badge>All</Badge>,
    },
    {
      title: "Active Now",
      value: summary.activeTimers ?? 0,
      badge: <Badge status="success">Active</Badge>,
    },
    {
      title: "Scheduled",
      value: summary.scheduledTimers ?? 0,
      badge: <Badge status="attention">Upcoming</Badge>,
    },
    {
      title: "Expired",
      value: summary.expiredTimers ?? 0,
      badge: <Badge status="critical">Ended</Badge>,
    },
    {
      title: "Total Impressions",
      value: Number(summary.totalImpressions ?? 0).toLocaleString(),
      badge: <Badge status="info">Views</Badge>,
    },
  ];

  return (
    <Card sectioned>
      <Stack vertical spacing="loose">
        <Stack distribution="equalSpacing" alignment="center">
          <div>
            <Text variant="headingLg" as="h2">
              Promotion Dashboard
            </Text>
            <Text color="subdued" as="p">
              Real-time summary of your storefront countdown timers and customer engagement.
            </Text>
          </div>
          <Button primary onClick={onCreateClick || (() => navigate("/create"))}>
            Create New Timer
          </Button>
        </Stack>

        <Layout>
          {stats.map((stat, i) => (
            <Layout.Section oneFifth key={i}>
              <div
                style={{
                  padding: "16px",
                  borderRadius: "8px",
                  backgroundColor: "#f6f6f7",
                  textAlign: "center",
                }}
              >
                <div style={{ marginBottom: "6px" }}>{stat.badge}</div>
                <Text variant="headingXl" as="p" fontWeight="bold">
                  {stat.value}
                </Text>
                <Text variant="bodySm" color="subdued" as="p">
                  {stat.title}
                </Text>
              </div>
            </Layout.Section>
          ))}
        </Layout>
      </Stack>
    </Card>
  );
}
