import { useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Box,
  Chip,
  Container,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";

import UseCaseStep from "./steps/UseCaseStep";
import UploadStep from "./steps/UploadStep";
import MappingStep from "./steps/MappingStep";
import ResolveStep from "./steps/ResolveStep";
import RoomsStep from "./steps/RoomsStep";
import RulesStep from "./steps/RulesStep";
import StrategyStep from "./steps/StrategyStep";
import ResultsStep from "./steps/ResultsStep";
import { presets } from "./lib/presets";

import type {
  FairnessMode,
  Labels,
  OptimizeResult,
  Participant,
  PlacementConstraint,
  Room,
  UnresolvedPreference,
  UploadPreview,
} from "./types";

const stepNames = [
  "Use case",
  "Import data",
  "Map columns",
  "Review names",
  "Groups",
  "Placement rules",
  "Optimization",
  "Results",
];

export default function App() {
  const [step, setStep] = useState(0);
  const [presetId, setPresetId] = useState("school");
  const [customLabels, setCustomLabels] = useState<Labels | null>(null);
  const [eventName, setEventName] = useState("");
  const [upload, setUpload] = useState<UploadPreview | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [unresolved, setUnresolved] = useState<UnresolvedPreference[]>([]);
  const [ranked, setRanked] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [constraints, setConstraints] = useState<PlacementConstraint[]>([]);
  const [fairnessMode, setFairnessMode] =
    useState<FairnessMode>("coverage_first");
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const labels = useMemo(() => {
    if (presetId === "custom" && customLabels) return customLabels;
    return presets.find((preset) => preset.id === presetId)?.labels ?? presets[0].labels;
  }, [presetId, customLabels]);

  const progress = ((step + 1) / stepNames.length) * 100;

  function reset() {
    setStep(0);
    setUpload(null);
    setParticipants([]);
    setUnresolved([]);
    setRooms([]);
    setConstraints([]);
    setResult(null);
    setError(null);
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "rgba(255,255,255,.92)",
          backdropFilter: "blur(14px)",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: 72 }}>
            <Stack direction="row" alignItems="center" spacing={1.4} sx={{ flexGrow: 1 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  bgcolor: "primary.main",
                  display: "grid",
                  placeItems: "center",
                  color: "white",
                  fontWeight: 800,
                  fontSize: 18,
                  boxShadow: "0 8px 22px rgba(22,32,51,.15)",
                }}
              >
                G
              </Box>
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
                  Groupistry
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: { xs: "none", sm: "block" }, mt: 0.3 }}
                >
                  Preference & Constraint Optimization Platform
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ display: { xs: "none", md: "flex" } }}>
              <Chip
                size="small"
                variant="outlined"
                icon={<ShieldOutlinedIcon fontSize="small" />}
                label="Hard constraints enforced"
              />
              <Chip
                size="small"
                variant="outlined"
                icon={<AutoAwesomeRoundedIcon fontSize="small" />}
                label="CP-SAT optimized"
              />
            </Stack>
          </Toolbar>
        </Container>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 3 }} />
      </AppBar>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4.5 } }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2.5 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "250px minmax(0, 1fr)" },
            gap: { xs: 2, lg: 3 },
            alignItems: "start",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              display: { xs: "none", lg: "block" },
              border: "1px solid",
              borderColor: "divider",
              p: 2,
              position: "sticky",
              top: 94,
            }}
          >
            <Typography variant="overline" color="text.secondary" fontWeight={800}>
              Workflow
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1.25 }}>
              {stepNames.map((name, index) => {
                const active = index === step;
                const complete = index < step;
                return (
                  <Stack
                    key={name}
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    sx={{
                      p: 1.15,
                      borderRadius: 2.5,
                      bgcolor: active ? "secondary.light" : "transparent",
                      color: active ? "secondary.dark" : "text.secondary",
                    }}
                  >
                    <Box
                      sx={{
                        width: 25,
                        height: 25,
                        flex: "0 0 auto",
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        border: "1px solid",
                        borderColor: complete || active ? "secondary.main" : "divider",
                        bgcolor: complete ? "secondary.main" : "background.paper",
                        color: complete ? "white" : active ? "secondary.main" : "text.secondary",
                      }}
                    >
                      {complete ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : index + 1}
                    </Box>
                    <Typography variant="body2" fontWeight={active ? 700 : 550}>
                      {name}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>

            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {eventName ? `Working on ${eventName}.` : "Set up an event to begin."} Your imported data is used only for this assignment session.
            </Typography>
          </Paper>

          <Box sx={{ minWidth: 0 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1.5, display: { lg: "none" } }}
            >
              <Typography variant="caption" color="text.secondary">
                Step {step + 1} of {stepNames.length}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {stepNames[step]}
              </Typography>
            </Stack>

            <Paper
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                p: { xs: 2.5, sm: 4, md: 5 },
                boxShadow: "0 18px 60px rgba(16,24,40,.05)",
              }}
            >
              {step === 0 && (
                <UseCaseStep
                  presetId={presetId}
                  onPresetChange={setPresetId}
                  customLabels={customLabels}
                  onCustomLabelsChange={setCustomLabels}
                  eventName={eventName}
                  onEventNameChange={setEventName}
                  onNext={() => setStep(1)}
                />
              )}

              {step === 1 && (
                <UploadStep
                  labels={labels}
                  upload={upload}
                  onUpload={setUpload}
                  onBack={() => setStep(0)}
                  onNext={() => setStep(2)}
                  onError={setError}
                />
              )}

              {step === 2 && upload && (
                <MappingStep
                  labels={labels}
                  upload={upload}
                  ranked={ranked}
                  onRankedChange={setRanked}
                  onImported={(data) => {
                    setParticipants(data.participants);
                    setUnresolved(data.unresolved_preferences);
                  }}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                  onError={setError}
                />
              )}

              {step === 3 && upload && (
                <ResolveStep
                  labels={labels}
                  uploadId={upload.upload_id}
                  participants={participants}
                  unresolved={unresolved}
                  onUnresolvedChange={setUnresolved}
                  onBack={() => setStep(2)}
                  onNext={() => setStep(4)}
                  onError={setError}
                />
              )}

              {step === 4 && upload && (
                <RoomsStep
                  labels={labels}
                  uploadId={upload.upload_id}
                  participants={participants}
                  rooms={rooms}
                  onRoomsChange={setRooms}
                  onBack={() => setStep(3)}
                  onNext={() => setStep(5)}
                  onError={setError}
                />
              )}

              {step === 5 && (
                <RulesStep
                  labels={labels}
                  participants={participants}
                  rooms={rooms}
                  constraints={constraints}
                  onConstraintsChange={setConstraints}
                  onBack={() => setStep(4)}
                  onNext={() => setStep(6)}
                />
              )}

              {step === 6 && upload && (
                <StrategyStep
                  labels={labels}
                  uploadId={upload.upload_id}
                  eventName={eventName || "Untitled Event"}
                  participants={participants}
                  rooms={rooms}
                  constraints={constraints}
                  ranked={ranked}
                  fairnessMode={fairnessMode}
                  onFairnessModeChange={setFairnessMode}
                  onResult={setResult}
                  onBack={() => setStep(5)}
                  onNext={() => setStep(7)}
                  onError={setError}
                />
              )}

              {step === 7 && upload && result && (
                <ResultsStep
                  labels={labels}
                  uploadId={upload.upload_id}
                  eventName={eventName || "Untitled Event"}
                  participants={participants}
                  rooms={rooms}
                  constraints={constraints}
                  ranked={ranked}
                  fairnessMode={fairnessMode}
                  result={result}
                  onBack={() => setStep(6)}
                  onStartOver={reset}
                  onError={setError}
                />
              )}
            </Paper>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", textAlign: "center", mt: 2 }}
            >
              Groupistry · Optimization powered by Google OR-Tools
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
