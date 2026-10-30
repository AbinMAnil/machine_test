import { useState } from "react";
import {
  Modal,
  TextField,
  Stack,
  Button,
  Tag,
  Text,
  Banner,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";

export function ResourcePickerModal({
  type, // 'product' | 'collection'
  selectedGids = [],
  onChange,
}) {
  const shopify = useAppBridge();
  const [openFallbackModal, setOpenFallbackModal] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");

  const resourceTitle = type === "product" ? "Products" : "Collections";
  const gidPrefix =
    type === "product" ? "gid://shopify/Product/" : "gid://shopify/Collection/";

  // Trigger official Shopify App Bridge Resource Picker if available
  const handleOpenPicker = async () => {
    try {
      if (window?.shopify?.resourcePicker) {
        const selection = await window.shopify.resourcePicker({
          type: type === "product" ? "product" : "collection",
          multiple: true,
          selectionIds: selectedGids.map((id) => ({ id })),
        });
        if (selection && Array.isArray(selection)) {
          const ids = selection.map((item) => item.id);
          onChange(ids);
          return;
        }
      }
    } catch (err) {
      console.warn("App Bridge resourcePicker not available in this context, opening fallback dialog:", err);
    }
    // Fallback modal
    setOpenFallbackModal(true);
  };

  const handleAddManualGid = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    let finalGid = trimmed;
    if (/^\d+$/.test(trimmed)) {
      finalGid = `${gidPrefix}${trimmed}`;
    }

    if (!finalGid.startsWith(gidPrefix)) {
      setInputError(
        `Must be a valid ID number (e.g. 12345678) or full GID (${gidPrefix}12345678)`
      );
      return;
    }

    if (!selectedGids.includes(finalGid)) {
      onChange([...selectedGids, finalGid]);
    }
    setInputValue("");
    setInputError("");
  };

  const handleRemove = (gidToRemove) => {
    onChange(selectedGids.filter((g) => g !== gidToRemove));
  };

  return (
    <Stack vertical spacing="tight">
      <Stack alignment="center">
        <Button onClick={handleOpenPicker}>
          Select {resourceTitle} ({selectedGids.length} selected)
        </Button>
        <Button
          plain
          onClick={() => setOpenFallbackModal(true)}
        >
          Enter ID manually
        </Button>
      </Stack>

      {selectedGids.length > 0 && (
        <Stack spacing="extraTight">
          {selectedGids.map((gid) => {
            const shortId = gid.split("/").pop();
            return (
              <Tag key={gid} onRemove={() => handleRemove(gid)}>
                {type === "product" ? `Product #${shortId}` : `Collection #${shortId}`}
              </Tag>
            );
          })}
        </Stack>
      )}

      {openFallbackModal && (
        <Modal
          open={openFallbackModal}
          onClose={() => setOpenFallbackModal(false)}
          title={`Select ${resourceTitle}`}
          primaryAction={{
            content: "Done",
            onAction: () => setOpenFallbackModal(false),
          }}
        >
          <Modal.Section>
            <Stack vertical spacing="loose">
              <Banner status="info">
                Select {resourceTitle.toLowerCase()} by entering their Shopify numeric ID (e.g. 789123456) or full GraphQL GID.
              </Banner>

              <Stack alignment="trailing">
                <Stack.Item fill>
                  <TextField
                    label={`Add ${type === "product" ? "Product" : "Collection"} ID`}
                    value={inputValue}
                    onChange={(val) => {
                      setInputValue(val);
                      setInputError("");
                    }}
                    placeholder={`e.g. 8472910482 or ${gidPrefix}8472910482`}
                    error={inputError}
                    autoComplete="off"
                  />
                </Stack.Item>
                <Button primary onClick={handleAddManualGid}>
                  Add
                </Button>
              </Stack>

              <div>
                <Text variant="headingSm" as="h6">
                  Selected {resourceTitle} ({selectedGids.length}):
                </Text>
                {selectedGids.length === 0 ? (
                  <Text color="subdued" as="p">
                    No {resourceTitle.toLowerCase()} selected yet.
                  </Text>
                ) : (
                  <div style={{ marginTop: "8px" }}>
                    <Stack spacing="tight">
                      {selectedGids.map((gid) => (
                        <Tag key={gid} onRemove={() => handleRemove(gid)}>
                          {gid}
                        </Tag>
                      ))}
                    </Stack>
                  </div>
                )}
              </div>
            </Stack>
          </Modal.Section>
        </Modal>
      )}
    </Stack>
  );
}
