import { Modal, TextContainer, Text } from "@shopify/polaris";

export function DeleteConfirmModal({
  open,
  timerName,
  isDeleting,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete Countdown Timer?"
      primaryAction={{
        content: isDeleting ? "Deleting..." : "Delete Timer",
        destructive: true,
        loading: isDeleting,
        onAction: onConfirm,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          disabled: isDeleting,
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <TextContainer>
          <Text as="p">
            Are you sure you want to delete <strong>{timerName}</strong>? This action cannot be undone.
          </Text>
          <Text as="p" color="subdued">
            The timer will immediately disappear from the storefront and its impression analytics will be permanently removed.
          </Text>
        </TextContainer>
      </Modal.Section>
    </Modal>
  );
}
