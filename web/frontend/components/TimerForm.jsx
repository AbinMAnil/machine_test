import { useState, useEffect } from "react";
import {
  Form,
  FormLayout,
  TextField,
  Select,
  ChoiceList,
  Stack,
  Button,
  Banner,
  Card,
  Layout,
  InlineError,
  Text,
} from "@shopify/polaris";
import { LiveTimerPreview } from "./LiveTimerPreview";
import { ResourcePickerModal } from "./ResourcePickerModal";

export function TimerForm({
  initialData = {},
  isSaving = false,
  apiError = null,
  onSubmit,
  onCancel,
}) {
  const [name, setName] = useState(initialData.name || "");
  const [type, setType] = useState(initialData.type || "fixed");
  const [status, setStatus] = useState(initialData.status || "active");

  // Fixed dates (ISO string or YYYY-MM-DDTHH:mm format for datetime-local)
  const defaultStart = initialData.startAt
    ? new Date(initialData.startAt).toISOString().slice(0, 16)
    : new Date().toISOString().slice(0, 16);

  const defaultEnd = initialData.endAt
    ? new Date(initialData.endAt).toISOString().slice(0, 16)
    : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16);

  const [startAt, setStartAt] = useState(defaultStart);
  const [endAt, setEndAt] = useState(defaultEnd);

  // Evergreen duration in hours and minutes
  const initialDuration = initialData.evergreenDurationSeconds || 3600;
  const [durationHours, setDurationHours] = useState(
    String(Math.floor(initialDuration / 3600))
  );
  const [durationMinutes, setDurationMinutes] = useState(
    String(Math.floor((initialDuration % 3600) / 60))
  );

  // Targeting
  const [targetingType, setTargetingType] = useState(
    initialData.targeting?.type || "all"
  );
  const [productIds, setProductIds] = useState(
    initialData.targeting?.productIds || []
  );
  const [collectionIds, setCollectionIds] = useState(
    initialData.targeting?.collectionIds || []
  );

  // Appearance
  const [text, setText] = useState(
    initialData.appearance?.text || "Limited time offer! Sale ends in {time}"
  );
  const [backgroundColor, setBackgroundColor] = useState(
    initialData.appearance?.backgroundColor || "#111827"
  );
  const [textColor, setTextColor] = useState(
    initialData.appearance?.textColor || "#ffffff"
  );
  const [position, setPosition] = useState(
    initialData.appearance?.position || "above_buy_button"
  );
  const [urgencyHours, setUrgencyHours] = useState(
    String(Math.floor((initialData.appearance?.urgencyThresholdSeconds ?? 3600) / 3600))
  );
  const [priority, setPriority] = useState(
    String(initialData.priority ?? 0)
  );

  // Client validation errors
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Timer name is required";
    }

    if (type === "fixed") {
      if (!startAt) {
        newErrors.startAt = "Start date and time is required";
      }
      if (!endAt) {
        newErrors.endAt = "End date and time is required";
      }
      if (startAt && endAt) {
        const startMs = new Date(startAt).getTime();
        const endMs = new Date(endAt).getTime();
        if (Number.isNaN(startMs)) newErrors.startAt = "Invalid start date";
        if (Number.isNaN(endMs)) newErrors.endAt = "Invalid end date";
        if (startMs >= endMs) {
          newErrors.endAt = "End date must be strictly after the start date";
        }
      }
    } else {
      const h = parseInt(durationHours, 10) || 0;
      const m = parseInt(durationMinutes, 10) || 0;
      const totalSec = h * 3600 + m * 60;
      if (totalSec < 60) {
        newErrors.duration = "Duration must be at least 1 minute (60 seconds)";
      } else if (totalSec > 30 * 24 * 3600) {
        newErrors.duration = "Duration cannot exceed 30 days";
      }
    }

    if (targetingType === "products" && productIds.length === 0) {
      newErrors.productIds = "Please select at least one product";
    }
    if (targetingType === "collections" && collectionIds.length === 0) {
      newErrors.collectionIds = "Please select at least one collection";
    }

    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(backgroundColor)) {
      newErrors.backgroundColor = "Must be a valid hex color (e.g. #111827 or #000)";
    }
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(textColor)) {
      newErrors.textColor = "Must be a valid hex color (e.g. #ffffff or #fff)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    let evergreenDurationSeconds = null;
    if (type === "evergreen") {
      const h = parseInt(durationHours, 10) || 0;
      const m = parseInt(durationMinutes, 10) || 0;
      evergreenDurationSeconds = h * 3600 + m * 60;
    }

    const urgencyThresholdSeconds =
      (parseInt(urgencyHours, 10) || 0) * 3600;

    const payload = {
      name: name.trim(),
      type,
      status,
      startAt: type === "fixed" ? new Date(startAt).toISOString() : null,
      endAt: type === "fixed" ? new Date(endAt).toISOString() : null,
      evergreenDurationSeconds,
      targeting: {
        type: targetingType,
        productIds: targetingType === "products" ? productIds : [],
        collectionIds: targetingType === "collections" ? collectionIds : [],
      },
      appearance: {
        text: text.trim(),
        backgroundColor,
        textColor,
        position,
        urgencyThresholdSeconds,
      },
      priority: parseInt(priority, 10) || 0,
    };

    onSubmit(payload);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Layout>
        <Layout.Section>
          <Stack vertical spacing="loose">
            {apiError && (
              <Banner status="critical" title="Error saving timer">
                <p>{apiError.message || apiError}</p>
                {apiError.issues && (
                  <ul>
                    {apiError.issues.map((iss, i) => (
                      <li key={i}>{iss.field}: {iss.message}</li>
                    ))}
                  </ul>
                )}
              </Banner>
            )}

            {/* General Settings */}
            <Card sectioned title="Basic Information">
              <FormLayout>
                <TextField
                  label="Timer Name"
                  value={name}
                  onChange={(val) => {
                    setName(val);
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  error={errors.name}
                  placeholder="e.g. Black Friday Flash Sale"
                  autoComplete="off"
                />

                <Select
                  label="Timer Type"
                  options={[
                    { label: "Fixed Date & Time (Universal Countdown)", value: "fixed" },
                    { label: "Evergreen (Visitor-Specific Timer)", value: "evergreen" },
                  ]}
                  value={type}
                  onChange={(val) => setType(val)}
                  helpText={
                    type === "fixed"
                      ? "Expires at an exact global date and time for all visitors simultaneously."
                      : "Starts counting down individually from the moment each visitor lands on your store."
                  }
                />

                {type === "fixed" ? (
                  <FormLayout.Group>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>
                        Start Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={startAt}
                        onChange={(e) => {
                          setStartAt(e.target.value);
                          if (errors.startAt) setErrors({ ...errors, startAt: null });
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          border: errors.startAt ? "1px solid #d72c0d" : "1px solid #c9cccf",
                          fontSize: "14px",
                        }}
                      />
                      {errors.startAt && <InlineError message={errors.startAt} fieldID="startAt" />}
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>
                        End Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={endAt}
                        onChange={(e) => {
                          setEndAt(e.target.value);
                          if (errors.endAt) setErrors({ ...errors, endAt: null });
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          border: errors.endAt ? "1px solid #d72c0d" : "1px solid #c9cccf",
                          fontSize: "14px",
                        }}
                      />
                      {errors.endAt && <InlineError message={errors.endAt} fieldID="endAt" />}
                    </div>
                  </FormLayout.Group>
                ) : (
                  <FormLayout.Group>
                    <TextField
                      label="Duration (Hours)"
                      type="number"
                      value={durationHours}
                      onChange={(val) => {
                        setDurationHours(val);
                        if (errors.duration) setErrors({ ...errors, duration: null });
                      }}
                      min={0}
                      autoComplete="off"
                    />
                    <TextField
                      label="Duration (Minutes)"
                      type="number"
                      value={durationMinutes}
                      onChange={(val) => {
                        setDurationMinutes(val);
                        if (errors.duration) setErrors({ ...errors, duration: null });
                      }}
                      min={0}
                      max={59}
                      autoComplete="off"
                      error={errors.duration}
                    />
                  </FormLayout.Group>
                )}
              </FormLayout>
            </Card>

            {/* Targeting */}
            <Card sectioned title="Product Targeting">
              <FormLayout>
                <ChoiceList
                  title="Where should this timer display?"
                  choices={[
                    { label: "All products across the store", value: "all" },
                    { label: "Specific products only", value: "products" },
                    { label: "Specific collections only", value: "collections" },
                  ]}
                  selected={[targetingType]}
                  onChange={(val) => {
                    setTargetingType(val[0]);
                    setErrors({ ...errors, productIds: null, collectionIds: null });
                  }}
                />

                {targetingType === "products" && (
                  <div>
                    <ResourcePickerModal
                      type="product"
                      selectedGids={productIds}
                      onChange={(ids) => {
                        setProductIds(ids);
                        if (errors.productIds) setErrors({ ...errors, productIds: null });
                      }}
                    />
                    {errors.productIds && <InlineError message={errors.productIds} fieldID="productIds" />}
                  </div>
                )}

                {targetingType === "collections" && (
                  <div>
                    <ResourcePickerModal
                      type="collection"
                      selectedGids={collectionIds}
                      onChange={(ids) => {
                        setCollectionIds(ids);
                        if (errors.collectionIds) setErrors({ ...errors, collectionIds: null });
                      }}
                    />
                    {errors.collectionIds && <InlineError message={errors.collectionIds} fieldID="collectionIds" />}
                  </div>
                )}
              </FormLayout>
            </Card>

            {/* Appearance & Design */}
            <Card sectioned title="Appearance & Urgency Behavior">
              <FormLayout>
                <TextField
                  label="Display Message"
                  value={text}
                  onChange={(val) => setText(val)}
                  helpText="Use token {time} to dynamically embed the remaining countdown digits inside the text."
                  autoComplete="off"
                />

                <FormLayout.Group>
                  <TextField
                    label="Background Color (Hex)"
                    value={backgroundColor}
                    onChange={(val) => {
                      setBackgroundColor(val);
                      if (errors.backgroundColor) setErrors({ ...errors, backgroundColor: null });
                    }}
                    error={errors.backgroundColor}
                    autoComplete="off"
                    prefix={
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "3px",
                          backgroundColor: /^#[0-9A-Fa-f]{3,6}$/.test(backgroundColor) ? backgroundColor : "#111827",
                          border: "1px solid #ccc",
                        }}
                      />
                    }
                  />

                  <TextField
                    label="Text Color (Hex)"
                    value={textColor}
                    onChange={(val) => {
                      setTextColor(val);
                      if (errors.textColor) setErrors({ ...errors, textColor: null });
                    }}
                    error={errors.textColor}
                    autoComplete="off"
                    prefix={
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "3px",
                          backgroundColor: /^#[0-9A-Fa-f]{3,6}$/.test(textColor) ? textColor : "#ffffff",
                          border: "1px solid #ccc",
                        }}
                      />
                    }
                  />
                </FormLayout.Group>

                <Select
                  label="Storefront Placement Position"
                  options={[
                    { label: "Above Buy Button", value: "above_buy_button" },
                    { label: "Below Buy Button", value: "below_buy_button" },
                    { label: "Top of Product Page", value: "top_of_page" },
                    { label: "Bottom of Product Page", value: "bottom_of_page" },
                    { label: "Custom Theme App Block Placement", value: "custom" },
                  ]}
                  value={position}
                  onChange={(val) => setPosition(val)}
                />

                <FormLayout.Group>
                  <TextField
                    label="Urgency Trigger Threshold (Hours before expiry)"
                    type="number"
                    value={urgencyHours}
                    onChange={(val) => setUrgencyHours(val)}
                    min={0}
                    helpText="When remaining time falls below this threshold, urgency animation and ending soon badge will activate."
                    autoComplete="off"
                  />
                  <TextField
                    label="Resolution Priority"
                    type="number"
                    value={priority}
                    onChange={(val) => setPriority(val)}
                    helpText="Higher priority timers are displayed first when multiple timers match a product."
                    autoComplete="off"
                  />
                </FormLayout.Group>
              </FormLayout>
            </Card>

            <Stack distribution="equalSpacing">
              <Button onClick={onCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button primary submit loading={isSaving}>
                Save Countdown Timer
              </Button>
            </Stack>
          </Stack>
        </Layout.Section>

        {/* Live Preview Sidebar */}
        <Layout.Section secondary>
          <div style={{ position: "sticky", top: "20px" }}>
            <LiveTimerPreview
              appearance={{
                backgroundColor,
                textColor,
                text,
                position,
                urgencyThresholdSeconds: (parseInt(urgencyHours, 10) || 0) * 3600,
              }}
              name={name}
              type={type}
            />

            <div style={{ marginTop: "16px" }}>
              <Card sectioned title="Timer Status">
                <Select
                  label="Activation Status"
                  options={[
                    { label: "Active (Visible on storefront when scheduled)", value: "active" },
                    { label: "Paused (Temporarily disabled)", value: "paused" },
                    { label: "Archived", value: "archived" },
                  ]}
                  value={status}
                  onChange={(val) => setStatus(val)}
                />
              </Card>
            </div>
          </div>
        </Layout.Section>
      </Layout>
    </Form>
  );
}
