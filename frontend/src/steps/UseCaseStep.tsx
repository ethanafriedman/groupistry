import type { ReactNode } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ForestOutlinedIcon from "@mui/icons-material/ForestOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import HotelOutlinedIcon from "@mui/icons-material/HotelOutlined";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

import StepShell from "../components/StepShell";
import { presets } from "../lib/presets";
import type { Labels } from "../types";

interface Props {
  presetId: string;
  onPresetChange: (id: string) => void;
  customLabels: Labels | null;
  onCustomLabelsChange: (labels: Labels) => void;
  eventName: string;
  onEventNameChange: (name: string) => void;
  onNext: () => void;
}

const presetIcons: Record<string, ReactNode> = {
  school: <SchoolOutlinedIcon />,
  camp: <ForestOutlinedIcon />,
  retreat: <Groups2OutlinedIcon />,
  conference: <BusinessCenterOutlinedIcon />,
  hotel: <HotelOutlinedIcon />,
  custom: <TuneRoundedIcon />,
};

export default function UseCaseStep({
  presetId,
  onPresetChange,
  customLabels,
  onCustomLabelsChange,
  eventName,
  onEventNameChange,
  onNext,
}: Props) {
  const fallback = presets.find((preset) => preset.id === "custom")!.labels;
  const labels = customLabels ?? fallback;

  return (
    <StepShell
      eyebrow="Event setup"
      title="What are you organizing?"
      description="Name your event, then choose the closest use case. Groupistry adapts the language in the interface while keeping the same optimization engine underneath."
      onNext={onNext}
      nextDisabled={!eventName.trim()}
    >
      <Box
        sx={{
          p: 2.25,
          borderRadius: 3,
          bgcolor: "#FAFAFC",
          border: "1px solid",
          borderColor: "divider",
          mb: 3,
        }}
      >
        <TextField
          label="Event name"
          value={eventName}
          onChange={(event) => onEventNameChange(event.target.value)}
          placeholder="e.g. Spring Retreat 2027"
          fullWidth
          helperText="This appears in your workflow and exported results."
        />
      </Box>

      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        Choose a template
      </Typography>
      <Grid container spacing={2}>
        {presets.map((preset) => {
          const selected = preset.id === presetId;

          return (
            <Grid item xs={12} sm={6} md={4} key={preset.id}>
              <Card
                sx={{
                  height: "100%",
                  position: "relative",
                  borderColor: selected ? "secondary.main" : "divider",
                  boxShadow: selected ? "0 10px 30px rgba(91,91,214,.10)" : undefined,
                  transition: "160ms ease",
                  transform: selected ? "translateY(-1px)" : "none",
                }}
              >
                {selected && (
                  <Box
                    aria-label="Selected"
                    sx={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      zIndex: 1,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "secondary.main",
                      color: "white",
                      boxShadow: "0 4px 12px rgba(91,91,214,.24)",
                    }}
                  >
                    <CheckRoundedIcon sx={{ fontSize: 16 }} />
                  </Box>
                )}
                <CardActionArea
                  onClick={() => onPresetChange(preset.id)}
                  sx={{ height: "100%", p: 0.25 }}
                >
                  <CardContent sx={{ p: 2.5, pr: selected ? 5 : 2.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2.5,
                          display: "grid",
                          placeItems: "center",
                          bgcolor: selected ? "secondary.light" : "#F2F4F7",
                          color: selected ? "secondary.main" : "text.secondary",
                          flex: "0 0 auto",
                        }}
                      >
                        {presetIcons[preset.id]}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontSize: 16.5 }}>
                          {preset.title}
                        </Typography>
                        <Typography
                          color="text.secondary"
                          variant="body2"
                          sx={{ mt: 0.6, lineHeight: 1.6 }}
                        >
                          {preset.subtitle}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {presetId === "custom" && (
        <Box
          sx={{
            mt: 3,
            p: 2.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            bgcolor: "#FAFAFC",
          }}
        >
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Custom terminology
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Rename the generic concepts to fit your organization.
          </Typography>
          <Grid container spacing={2}>
            {[
              ["participant", "Person label"],
              ["participantPlural", "People label"],
              ["room", "Assignment group label"],
              ["roomPlural", "Assignment groups label"],
              ["preference", "Preference label"],
              ["preferencePlural", "Preferences label"],
            ].map(([key, label]) => (
              <Grid item xs={12} sm={6} key={key}>
                <TextField
                  fullWidth
                  label={label}
                  value={labels[key as keyof Labels]}
                  onChange={(event) =>
                    onCustomLabelsChange({
                      ...labels,
                      [key]: event.target.value,
                    })
                  }
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </StepShell>
  );
}
