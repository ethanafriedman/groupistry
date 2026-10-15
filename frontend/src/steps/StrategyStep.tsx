import { useState } from "react";
import type { ReactNode } from "react";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import BalanceRoundedIcon from "@mui/icons-material/BalanceRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

import StepShell from "../components/StepShell";
import { optimize } from "../lib/api";
import type {
  FairnessMode,
  Labels,
  OptimizeResult,
  Participant,
  PlacementConstraint,
  Room,
} from "../types";

const modes: {
  id: FairnessMode;
  title: string;
  description: string;
  recommended?: boolean;
  example?: string;
  icon: ReactNode;
}[] = [
  {
    id: "coverage_first",
    title: "Fair Coverage",
    description:
      "First maximize how many people get at least one requested person, then improve ranked and mutual preference quality.",
    recommended: true,
    example: "Example: prefer 9 people each getting one match over 6 people getting several matches.",
    icon: <Groups2OutlinedIcon />,
  },
  {
    id: "balanced",
    title: "Balanced",
    description:
      "Combine coverage, ranked choices, mutual requests, fairness, and group balance into one weighted objective.",
    icon: <BalanceRoundedIcon />,
  },
  {
    id: "top_choices",
    title: "Top Choices",
    description:
      "Prioritize first-choice matches before improving the remaining preference quality.",
    icon: <StarBorderRoundedIcon />,
  },
  {
    id: "total_satisfaction",
    title: "Maximize Total Preference Score",
    description:
      "Maximize the total weighted value of honored preferences across the entire assignment.",
    icon: <InsightsOutlinedIcon />,
  },
];

export default function StrategyStep({
  labels,
  uploadId,
  eventName,
  participants,
  rooms,
  constraints,
  ranked,
  fairnessMode,
  onFairnessModeChange,
  onResult,
  onBack,
  onNext,
  onError,
}: {
  labels: Labels;
  uploadId: string;
  eventName: string;
  participants: Participant[];
  rooms: Room[];
  constraints: PlacementConstraint[];
  ranked: boolean;
  fairnessMode: FairnessMode;
  onFairnessModeChange: (mode: FairnessMode) => void;
  onResult: (result: OptimizeResult) => void;
  onBack: () => void;
  onNext: () => void;
  onError: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [infeasible, setInfeasible] = useState<string | null>(null);

  const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);

  async function run() {
    setLoading(true);
    setInfeasible(null);

    try {
      const result = await optimize(uploadId, {
        settings: {
          event_name: eventName,
          requests_ranked: ranked,
          fairness_mode: fairnessMode,
          allow_underfilled_rooms: true,
          minimum_room_size: 1,
          priorities: {
            avoid_unmatched: "high",
            top_choices: "high",
            mutual_preferences: "high",
            lower_ranked_preferences: "medium",
            fairness: "high",
            even_room_sizes: "low",
          },
        },
        rooms,
        constraints,
        time_limit_seconds: 30,
      });

      if (!result.assignments.length || !["OPTIMAL", "FEASIBLE"].includes(result.status.toUpperCase())) {
        setInfeasible(result.status || "INFEASIBLE");
        return;
      }

      onResult(result);
      onNext();
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      if (typeof detail === "string" && /infeasible|no valid|conflict|cannot be both|locked to multiple|must be together/i.test(detail)) {
        setInfeasible(detail);
      } else {
        onError(detail ?? "The optimizer could not run.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <StepShell
      eyebrow="Optimization objective"
      title="Choose what the solver should prioritize"
      description={`All hard placement rules and ${labels.room.toLowerCase()} capacities stay mandatory. This setting controls how Groupistry ranks the valid solutions that remain.`}
      onBack={onBack}
      onNext={run}
      nextLabel={loading ? "Optimizing…" : "Generate assignments"}
      nextDisabled={loading}
    >
      {infeasible && (
        <Card sx={{ mb: 3, borderColor: "error.light", bgcolor: "#FFF8F7" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <ErrorOutlineRoundedIcon color="error" />
              <Box>
                <Typography variant="h6" sx={{ fontSize: 17 }}>No valid assignment exists</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, lineHeight: 1.65 }}>
                  The current combination of capacities and hard placement rules cannot produce a valid assignment. Review the items below and try again.
                </Typography>
                <List dense sx={{ mt: 1, py: 0 }}>
                  <ListItem disableGutters>
                    <ListItemText primary={`Capacity: ${totalCapacity} total spots for ${participants.length} people.`} />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText primary={`${constraints.length} hard constraint${constraints.length === 1 ? " is" : "s are"} currently active.`} />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText primary="Check for must-be-together groups that are larger than a room, locked placements that compete for the same capacity, or conflicting must/cannot rules." />
                  </ListItem>
                </List>
                <Typography variant="caption" color="text.secondary">
                  Solver status: {infeasible}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2}>
        {modes.map((mode) => {
          const selected = fairnessMode === mode.id;

          return (
            <Grid item xs={12} md={6} key={mode.id}>
              <Card
                sx={{
                  height: "100%",
                  borderColor: selected ? "secondary.main" : "divider",
                  boxShadow: selected ? "0 10px 30px rgba(91,91,214,.10)" : undefined,
                  transition: "160ms ease",
                }}
              >
                <CardActionArea sx={{ height: "100%" }} onClick={() => onFairnessModeChange(mode.id)}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
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
                          {mode.icon}
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontSize: 16.5 }}>
                            {mode.title}
                          </Typography>
                          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.7, lineHeight: 1.65 }}>
                            {mode.description}
                          </Typography>
                          {mode.example && (
                            <Box
                              sx={{
                                mt: 1.5,
                                px: 1.25,
                                py: 1,
                                borderRadius: 2,
                                bgcolor: selected ? "secondary.light" : "#F7F8FA",
                              }}
                            >
                              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                {mode.example}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Stack>
                      {mode.recommended && <Chip label="Recommended" color="secondary" size="small" />}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Alert icon={<LockOutlinedIcon />} severity="info" variant="outlined" sx={{ mt: 3 }}>
        <Typography variant="body2">
          This run includes <strong>{participants.length}</strong> {labels.participantPlural.toLowerCase()}, <strong>{rooms.length}</strong> {labels.roomPlural.toLowerCase()}, and <strong>{constraints.length}</strong> private hard constraint{constraints.length === 1 ? "" : "s"}.
        </Typography>
      </Alert>

      <Dialog open={loading} aria-labelledby="optimization-progress-title" PaperProps={{ sx: { borderRadius: 4, minWidth: { sm: 420 } } }}>
        <DialogContent sx={{ p: 4.5, textAlign: "center" }}>
          <CircularProgress color="secondary" size={42} thickness={4} />
          <Typography id="optimization-progress-title" variant="h6" sx={{ mt: 2.25 }}>
            Finding the best assignment…
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8, lineHeight: 1.65 }}>
            Evaluating capacities, hard placement rules, and participant preferences. Complex assignments can take a few seconds.
          </Typography>
        </DialogContent>
      </Dialog>
    </StepShell>
  );
}
