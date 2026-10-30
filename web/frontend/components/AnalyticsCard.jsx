import {
  Card,
  Layout,
  Text,
  Stack,
  IndexTable,
  Badge,
  EmptyState,
  ProgressBar,
} from "@shopify/polaris";

export function AnalyticsCard({ analytics = {}, isLoading = false }) {
  const { summary = {}, timerBreakdown = [], dailyTrend = [] } = analytics;
  const totalImpressions = summary.totalImpressions || 0;

  if (totalImpressions === 0 && timerBreakdown.length === 0) {
    return (
      <Card sectioned>
        <EmptyState
          heading="No impressions recorded yet"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>
            When customers view your product pages with active countdown timers,
            impressions will automatically appear here in real time.
          </p>
        </EmptyState>
      </Card>
    );
  }

  const breakdownRows = timerBreakdown.map((item, index) => {
    const percent =
      totalImpressions > 0
        ? Math.round((item.impressions / totalImpressions) * 100)
        : 0;

    return (
      <IndexTable.Row id={item.id} key={item.id} position={index}>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {item.name}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge status={item.type === "fixed" ? "info" : "new"}>
            {item.type === "fixed" ? "Fixed" : "Evergreen"}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge status={item.effectiveStatus === "active" ? "success" : "subdued"}>
            {item.effectiveStatus}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="semibold" as="span">
            {Number(item.impressions).toLocaleString()}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Stack alignment="center" spacing="tight">
            <div style={{ width: "100px" }}>
              <ProgressBar progress={percent} size="small" />
            </div>
            <Text variant="bodySm" as="span">{percent}%</Text>
          </Stack>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  const trendRows = dailyTrend.map((row, index) => (
    <IndexTable.Row id={row.date} key={row.date} position={index}>
      <IndexTable.Cell>
        <Text variant="bodyMd" as="span">
          {row.date}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="semibold" as="span">
          {Number(row.impressions).toLocaleString()}
        </Text>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Stack vertical spacing="loose">
      <Card sectioned title="Total Promotional Impressions">
        <Stack distribution="equalSpacing" alignment="center">
          <div>
            <Text variant="heading2xl" as="p" fontWeight="bold">
              {Number(totalImpressions).toLocaleString()}
            </Text>
            <Text color="subdued" as="p">
              Aggregated views across all active and scheduled product timers
            </Text>
          </div>
          <Badge status="success" size="medium">
            Live Storefront Tracking
          </Badge>
        </Stack>
      </Card>

      <Layout>
        <Layout.Section>
          <Card title="Impression Performance by Timer">
            <IndexTable
              resourceName={{ singular: "timer", plural: "timers" }}
              itemCount={timerBreakdown.length}
              headings={[
                { title: "Timer Name" },
                { title: "Type" },
                { title: "Status" },
                { title: "Total Views" },
                { title: "Share of Impressions" },
              ]}
              selectable={false}
            >
              {breakdownRows}
            </IndexTable>
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          <Card title="Daily Impressions (Last 30 Days)">
            {dailyTrend.length === 0 ? (
              <div style={{ padding: "16px" }}>
                <Text color="subdued" as="p">No daily data available</Text>
              </div>
            ) : (
              <IndexTable
                resourceName={{ singular: "day", plural: "days" }}
                itemCount={dailyTrend.length}
                headings={[{ title: "Date (UTC)" }, { title: "Impressions" }]}
                selectable={false}
              >
                {trendRows}
              </IndexTable>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Stack>
  );
}
