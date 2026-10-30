import { useState } from "react";
import { Card, Text, Badge, Button, Stack, Box } from "@shopify/polaris";

export function LiveTimerPreview({ appearance, name, type }) {
  const [previewUrgent, setPreviewUrgent] = useState(false);

  const bg = appearance?.backgroundColor || "#111827";
  const textColor = appearance?.textColor || "#ffffff";
  const text = appearance?.text || "Limited time offer! Sale ends in {time}";
  const position = appearance?.position || "above_buy_button";

  const mockTimeStr = "02:45:18";
  const formattedText = text
    .replace("{time}", mockTimeStr)
    .replace("{countdown}", mockTimeStr);
  const hasToken = text.includes("{time}") || text.includes("{countdown}");

  return (
    <Card sectioned title="Live Storefront Preview">
      <Stack vertical spacing="tight">
        <Stack distribution="equalSpacing" alignment="center">
          <Text variant="bodySm" color="subdued">
            Live simulation of how customers will see this timer
          </Text>
          <Button
            size="slim"
            pressed={previewUrgent}
            onClick={() => setPreviewUrgent(!previewUrgent)}
          >
            {previewUrgent ? "Normal State" : "Simulate Urgency State"}
          </Button>
        </Stack>

        <div
          style={{
            marginTop: "12px",
            padding: "16px 20px",
            borderRadius: "8px",
            backgroundColor: bg,
            color: textColor,
            textAlign: "center",
            boxShadow: previewUrgent
              ? "0 0 16px rgba(239, 68, 68, 0.45)"
              : "0 2px 8px rgba(0,0,0,0.08)",
            transition: "all 0.3s ease",
            border: previewUrgent ? "1px solid rgba(239, 68, 68, 0.6)" : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: 600,
              fontSize: "15px",
            }}
          >
            <span>{formattedText}</span>
            {previewUrgent && (
              <span
                style={{
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                ⚡ Ending Soon!
              </span>
            )}
          </div>

          {!hasToken && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              {[
                { num: "00", label: "Days" },
                { num: "02", label: "Hours" },
                { num: "45", label: "Mins" },
                { num: "18", label: "Secs" },
              ].map((box, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    minWidth: "40px",
                  }}
                >
                  <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                    {box.num}
                  </span>
                  <span
                    style={{
                      fontSize: "9px",
                      textTransform: "uppercase",
                      opacity: 0.8,
                    }}
                  >
                    {box.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Stack spacing="extraTight" alignment="center">
          <Badge status="info">Position: {position.replace(/_/g, " ")}</Badge>
          <Badge>{type === "fixed" ? "Fixed Date Timer" : "Evergreen Timer"}</Badge>
        </Stack>
      </Stack>
    </Card>
  );
}
