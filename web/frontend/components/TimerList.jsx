import { useState } from "react";
import {
  Card,
  IndexTable,
  Badge,
  Stack,
  Button,
  ButtonGroup,
  TextField,
  Select,
  EmptyState,
  Spinner,
  Text,
} from "@shopify/polaris";
import { useNavigate } from "react-router-dom";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

export function TimerList({
  timers = [],
  isLoading = false,
  statusFilter = "all",
  searchQuery = "",
  onStatusFilterChange,
  onSearchChange,
  onToggleStatus,
  onDeleteTimer,
}) {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusBadge = (effectiveStatus) => {
    switch (effectiveStatus) {
      case "active":
        return <Badge status="success">Active</Badge>;
      case "scheduled":
        return <Badge status="attention">Scheduled</Badge>;
      case "expired":
        return <Badge status="critical">Expired</Badge>;
      case "paused":
        return <Badge status="warning">Paused</Badge>;
      case "archived":
        return <Badge>Archived</Badge>;
      default:
        return <Badge>{effectiveStatus}</Badge>;
    }
  };

  const getTargetingSummary = (targeting) => {
    if (!targeting || targeting.type === "all") {
      return "All Products";
    }
    if (targeting.type === "products") {
      const count = targeting.productIds?.length || 0;
      return `${count} ${count === 1 ? "Product" : "Products"}`;
    }
    if (targeting.type === "collections") {
      const count = targeting.collectionIds?.length || 0;
      return `${count} ${count === 1 ? "Collection" : "Collections"}`;
    }
    return "Custom";
  };

  const formatSchedule = (timer) => {
    if (timer.type === "evergreen") {
      const dur = timer.evergreenDurationSeconds || 0;
      const hours = Math.floor(dur / 3600);
      const mins = Math.floor((dur % 3600) / 60);
      return `${hours}h ${mins}m per visitor`;
    }
    if (timer.startAt && timer.endAt) {
      const start = new Date(timer.startAt).toLocaleDateString();
      const end = new Date(timer.endAt).toLocaleDateString();
      return `${start} — ${end}`;
    }
    return "-";
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDeleteTimer(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const rowMarkup = timers.map((timer, index) => (
    <IndexTable.Row id={timer.id} key={timer.id} position={index}>
      <IndexTable.Cell>
        <Stack vertical spacing="extraTight">
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {timer.name}
          </Text>
          <Text variant="bodySm" color="subdued" as="span">
            Priority: {timer.priority ?? 0}
          </Text>
        </Stack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Badge status={timer.type === "fixed" ? "info" : "new"}>
          {timer.type === "fixed" ? "Fixed Date" : "Evergreen"}
        </Badge>
      </IndexTable.Cell>

      <IndexTable.Cell>{getTargetingSummary(timer.targeting)}</IndexTable.Cell>

      <IndexTable.Cell>{formatSchedule(timer)}</IndexTable.Cell>

      <IndexTable.Cell>{getStatusBadge(timer.effectiveStatus)}</IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="semibold" as="span">
          {Number(timer.impressions ?? 0).toLocaleString()}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <ButtonGroup segmented>
          <Button
            size="slim"
            onClick={() => navigate(`/edit?id=${timer.id}`)}
          >
            Edit
          </Button>
          <Button
            size="slim"
            onClick={() =>
              onToggleStatus(
                timer.id,
                timer.status === "active" ? "paused" : "active"
              )
            }
          >
            {timer.status === "active" ? "Pause" : "Activate"}
          </Button>
          <Button
            size="slim"
            destructive
            onClick={() => setDeleteTarget(timer)}
          >
            Delete
          </Button>
        </ButtonGroup>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Card>
      <div style={{ padding: "16px" }}>
        <Stack distribution="equalSpacing" alignment="center">
          <div style={{ flex: 1, maxWidth: "320px" }}>
            <TextField
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Search timers by name..."
              clearButton
              onClearButtonClick={() => onSearchChange("")}
              autoComplete="off"
            />
          </div>

          <div style={{ width: "200px" }}>
            <Select
              options={[
                { label: "All Statuses", value: "all" },
                { label: "Active", value: "active" },
                { label: "Scheduled", value: "scheduled" },
                { label: "Expired", value: "expired" },
                { label: "Paused", value: "paused" },
              ]}
              value={statusFilter}
              onChange={onStatusFilterChange}
            />
          </div>
        </Stack>
      </div>

      {isLoading ? (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <Spinner size="large" />
          <Text as="p" color="subdued" style={{ marginTop: "12px" }}>
            Loading countdown timers...
          </Text>
        </div>
      ) : timers.length === 0 ? (
        <EmptyState
          heading="No countdown timers found"
          action={{
            content: "Create Countdown Timer",
            onAction: () => navigate("/create"),
          }}
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or status filter."
              : "Create high-converting promotional countdown timers to drive urgency and sales on your product pages."}
          </p>
        </EmptyState>
      ) : (
        <IndexTable
          resourceName={{ singular: "timer", plural: "timers" }}
          itemCount={timers.length}
          headings={[
            { title: "Timer Name" },
            { title: "Type" },
            { title: "Targeting" },
            { title: "Schedule / Duration" },
            { title: "Effective Status" },
            { title: "Impressions" },
            { title: "Actions" },
          ]}
          selectable={false}
        >
          {rowMarkup}
        </IndexTable>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          open={Boolean(deleteTarget)}
          timerName={deleteTarget.name}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </Card>
  );
}
