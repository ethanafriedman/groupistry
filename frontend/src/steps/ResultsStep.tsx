import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import StarOutlineRoundedIcon from "@mui/icons-material/StarOutlineRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";

import MetricCard from "../components/MetricCard";
import StepShell from "../components/StepShell";
import { exportAssignments } from "../lib/api";
import type {
  FairnessMode,
  Labels,
  OptimizeResult,
  Participant,
  PlacementConstraint,
  Room,
} from "../types";

export default function ResultsStep({
  labels,
  uploadId,
  eventName,
  participants,
  rooms,
  constraints,
  ranked,
  fairnessMode,
  result,
  onBack,
  onStartOver,
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
  result: OptimizeResult;
  onBack: () => void;
  onStartOver: () => void;
  onError: (message: string) => void;
}) {
  const [showUnmatched, setShowUnmatched] = useState(false);

  const byId = Object.fromEntries(
    participants.map((participant) => [participant.participant_id, participant]),
  );

  const payload = {
    settings: {
      event_name: eventName,
      requests_ranked: ranked,
      fairness_mode: fairnessMode,
      allow_underfilled_rooms: true,
      minimum_room_size: 1,
      priorities: {
        avoid_unmatched: "high" as const,
        top_choices: "high" as const,
        mutual_preferences: "high" as const,
        lower_ranked_preferences: "medium" as const,
        fairness: "high" as const,
        even_room_sizes: "low" as const,
      },
    },
    rooms,
    constraints,
    time_limit_seconds: 30,
  };

  async function download(type: "xlsx" | "csv") {
    try {
      await exportAssignments(uploadId, payload, type);
    } catch (error: any) {
      onError(error?.response?.data?.detail ?? "Could not export assignments.");
    }
  }

  const coveragePercent = Math.round(result.stats.coverage_rate * 100);
  const unmatchedIds = participants
    .filter((participant) => {
      const info = result.stats.per_person[participant.participant_id];
      return (info?.matched_preference_ids.length ?? 0) === 0;
    })
    .map((participant) => participant.participant_id);

  return (
    <StepShell
      eyebrow="Optimization complete"
      title="Your assignments are ready"
      description={`Review the outcome for ${eventName}, inspect each ${labels.room.toLowerCase()}, and export the final assignment list.`}
      onBack={onBack}
      footer={
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={() => download("xlsx")}>
            Excel
          </Button>
          <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={() => download("csv")}>
            CSV
          </Button>
          <Button color="inherit" startIcon={<RestartAltRoundedIcon />} onClick={onStartOver}>
            Start over
          </Button>
        </Stack>
      }
    >
      <Alert severity="success" variant="outlined" sx={{ mb: 2.5 }}>
        Solver status: <strong>{result.status}</strong>. All reported assignments satisfy the configured hard constraints.
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Preference coverage"
            value={`${coveragePercent}%`}
            note={`${result.stats.participants_with_a_match} of ${result.stats.participant_count} people`}
            icon={<Groups2OutlinedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Top choices honored"
            value={String(result.stats.top_choices_honored)}
            icon={<StarOutlineRoundedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Total preferences honored"
            value={String(result.stats.total_preferences_honored)}
            icon={<CheckCircleOutlineRoundedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Mutual pairs honored"
            value={String(result.stats.mutual_pairs_honored)}
            icon={<FavoriteBorderRoundedIcon fontSize="small" />}
          />
        </Grid>
      </Grid>

      <Card sx={{ mt: 3, bgcolor: "#FAFAFC" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={750}>Assignment summary</Typography>
          <Grid container spacing={2} sx={{ mt: 0.25 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Covered participants</Typography>
              <Typography variant="h6" sx={{ mt: 0.3 }}>
                {result.stats.participants_with_a_match} of {result.stats.participant_count}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                received at least one requested person
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">First choices honored</Typography>
              <Typography variant="h6" sx={{ mt: 0.3 }}>{result.stats.top_choices_honored}</Typography>
              <Typography variant="caption" color="text.secondary">
                participants received a rank-1 match
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Without a matched request</Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3 }}>
                <Typography variant="h6">{unmatchedIds.length}</Typography>
                {unmatchedIds.length > 0 && (
                  <Button
                    size="small"
                    color="secondary"
                    endIcon={showUnmatched ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                    onClick={() => setShowUnmatched((value) => !value)}
                  >
                    {showUnmatched ? "Hide" : "View participants"}
                  </Button>
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                review these participants if manual adjustments are needed
              </Typography>
            </Grid>
          </Grid>

          <Collapse in={showUnmatched}>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {unmatchedIds.map((participantId) => {
                const participant = byId[participantId];
                const info = result.stats.per_person[participantId];
                return (
                  <Chip
                    key={participantId}
                    icon={<PersonSearchOutlinedIcon />}
                    label={`${participant?.name ?? participantId}${(info?.preference_count ?? 0) === 0 ? " · no requests submitted" : ""}`}
                    variant="outlined"
                  />
                );
              })}
            </Stack>
          </Collapse>
        </CardContent>
      </Card>

      <Box
        sx={{
          mt: 3,
          p: 2.25,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          bgcolor: "#FAFAFC",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2" fontWeight={700}>Coverage</Typography>
          <Typography variant="body2" color="text.secondary">{coveragePercent}%</Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={coveragePercent}
          color="secondary"
          sx={{ height: 8, borderRadius: 999, bgcolor: "#E9EAF0" }}
        />
      </Box>

      <Stack spacing={2} sx={{ mt: 4 }}>
        {result.assignments.map((assignment) => {
          const matchedCount = assignment.participants.filter(
            (id) => (result.stats.per_person[id]?.matched_preference_ids.length ?? 0) > 0,
          ).length;
          const fillPercent = assignment.capacity > 0
            ? Math.round((assignment.participants.length / assignment.capacity) * 100)
            : 0;

          return (
            <Card key={assignment.room_id}>
              <CardContent sx={{ p: 0 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  spacing={1.5}
                  sx={{ p: 2.5 }}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h6">{assignment.room_name}</Typography>
                      <Chip size="small" variant="outlined" label={`${assignment.participants.length}/${assignment.capacity}`} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {matchedCount} participant{matchedCount === 1 ? "" : "s"} with at least one matched request
                    </Typography>
                  </Box>

                  <Box sx={{ minWidth: { sm: 160 } }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">Capacity used</Typography>
                      <Typography variant="caption" color="text.secondary">{fillPercent}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(fillPercent, 100)}
                      sx={{ mt: 0.75, height: 6, borderRadius: 999, bgcolor: "#EEF0F3" }}
                    />
                  </Box>
                </Stack>

                <Divider />

                <Grid container spacing={1.25} sx={{ p: 2.5 }}>
                  {assignment.participants.map((participantId) => {
                    const participant = byId[participantId];
                    const info = result.stats.per_person[participantId];
                    const matched = info?.matched_preference_ids.length ?? 0;

                    return (
                      <Grid item xs={12} sm={6} md={4} key={participantId}>
                        <Box
                          sx={{
                            p: 1.6,
                            borderRadius: 2.5,
                            bgcolor: matched > 0 ? "#F7F7FF" : "#FAFAFC",
                            border: "1px solid",
                            borderColor: matched > 0 ? "#DEDEFA" : "divider",
                            height: "100%",
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" spacing={1}>
                            <Typography fontWeight={700} noWrap title={participant?.name ?? participantId}>
                              {participant?.name ?? participantId}
                            </Typography>
                            {matched > 0 && <CheckCircleOutlineRoundedIcon color="success" sx={{ fontSize: 19 }} />}
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {matched} of {info?.preference_count ?? 0} requests matched
                          </Typography>

                          {(info?.matched_preference_ids.length ?? 0) > 0 ? (
                            <Stack spacing={0.65} sx={{ mt: 1.25 }}>
                              {(info?.matched_preference_ids ?? []).map((targetId, matchIndex) => {
                                const target = byId[targetId];
                                const rank = info?.matched_ranks[matchIndex];
                                return (
                                  <Stack
                                    key={`${participantId}-${targetId}-${matchIndex}`}
                                    direction="row"
                                    spacing={0.75}
                                    alignItems="center"
                                    sx={{ minWidth: 0 }}
                                  >
                                    <CheckCircleOutlineRoundedIcon color="success" sx={{ fontSize: 16, flex: "0 0 auto" }} />
                                    <Typography variant="caption" fontWeight={650} noWrap title={target?.name ?? targetId}>
                                      {target?.name ?? targetId}
                                    </Typography>
                                    {rank != null && (
                                      <Chip size="small" label={`Rank ${rank}`} variant="outlined" sx={{ height: 20, fontSize: 10.5 }} />
                                    )}
                                  </Stack>
                                );
                              })}
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.1, fontStyle: "italic" }}>
                              {(info?.preference_count ?? 0) > 0 ? "No submitted requests matched" : "No requests submitted"}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </StepShell>
  );
}
