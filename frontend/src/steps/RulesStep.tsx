import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import StepShell from "../components/StepShell";
import type {
  ConstraintKind,
  Labels,
  Participant,
  PlacementConstraint,
  Room,
} from "../types";

const ruleLabels: Record<ConstraintKind, string> = {
  must_be_with: "Must be together",
  cannot_be_with: "Cannot be together",
  locked_room: "Lock to group",
};

const ruleDescriptions: Record<ConstraintKind, string> = {
  must_be_with: "The two selected people must be assigned to the same group.",
  cannot_be_with: "The two selected people are not allowed in the same group.",
  locked_room: "The selected person must be assigned to the selected group.",
};

const ruleColors: Record<ConstraintKind, "success" | "error" | "info"> = {
  must_be_with: "success",
  cannot_be_with: "error",
  locked_room: "info",
};

function normalizedRuleKey(rule: PlacementConstraint) {
  if (rule.kind === "locked_room") {
    return `${rule.kind}:${rule.participant_id}:${rule.target_id}`;
  }
  const [first, second] = [rule.participant_id, rule.target_id].sort();
  return `${rule.kind}:${first}:${second}`;
}

export default function RulesStep({
  labels,
  participants,
  rooms,
  constraints,
  onConstraintsChange,
  onBack,
  onNext,
}: {
  labels: Labels;
  participants: Participant[];
  rooms: Room[];
  constraints: PlacementConstraint[];
  onConstraintsChange: (items: PlacementConstraint[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [kind, setKind] = useState<ConstraintKind>("cannot_be_with");
  const [participantId, setParticipantId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [ruleMessage, setRuleMessage] = useState<string | null>(null);

  const proposedRule = useMemo<PlacementConstraint | null>(() => {
    if (!participantId || !targetId) return null;
    return { kind, participant_id: participantId, target_id: targetId };
  }, [kind, participantId, targetId]);

  const isDuplicate = proposedRule
    ? constraints.some((constraint) => normalizedRuleKey(constraint) === normalizedRuleKey(proposedRule))
    : false;

  function addRule() {
    if (!proposedRule) return;
    if (isDuplicate) {
      setRuleMessage("That rule is already active.");
      return;
    }

    onConstraintsChange([...constraints, proposedRule]);
    setTargetId("");
    setRuleMessage(null);
  }

  const targetOptions =
    kind === "locked_room"
      ? rooms.map((room) => ({ id: room.room_id, label: room.name }))
      : participants
          .filter((participant) => participant.participant_id !== participantId)
          .map((participant) => ({
            id: participant.participant_id,
            label: participant.name,
          }));

  const names = Object.fromEntries(
    participants.map((participant) => [participant.participant_id, participant.name]),
  );
  const roomNames = Object.fromEntries(rooms.map((room) => [room.room_id, room.name]));

  return (
    <StepShell
      eyebrow="Hard constraints"
      title="Add private placement rules"
      description={`These administrator-only rules are mandatory. They stay separate from participant preferences and do not need to appear in the uploaded ${labels.participantPlural.toLowerCase()} file.`}
      onBack={onBack}
      onNext={onNext}
    >
      <Alert icon={<LockOutlinedIcon />} severity="info" variant="outlined" sx={{ mb: 2.5 }}>
        Hard constraints always override preference requests. If the rules conflict with each other, the solver will report that no valid assignment exists.
      </Alert>

      <Card sx={{ bgcolor: "#FAFAFC" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack spacing={1.75}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ md: "center" }}
            >
              <TextField
                select
                label="Rule type"
                value={kind}
                onChange={(event) => {
                  setKind(event.target.value as ConstraintKind);
                  setTargetId("");
                  setRuleMessage(null);
                }}
                sx={{ minWidth: { md: 190 }, flex: 1 }}
              >
                {Object.entries(ruleLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label={labels.participant}
                value={participantId}
                onChange={(event) => {
                  setParticipantId(event.target.value);
                  setTargetId("");
                  setRuleMessage(null);
                }}
                sx={{ minWidth: { md: 210 }, flex: 1 }}
              >
                {participants.map((participant) => (
                  <MenuItem key={participant.participant_id} value={participant.participant_id}>
                    {participant.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label={kind === "locked_room" ? labels.room : `Other ${labels.participant.toLowerCase()}`}
                value={targetId}
                onChange={(event) => {
                  setTargetId(event.target.value);
                  setRuleMessage(null);
                }}
                sx={{ minWidth: { md: 210 }, flex: 1 }}
              >
                {targetOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <Button
                variant="contained"
                color="secondary"
                startIcon={<AddRoundedIcon />}
                onClick={addRule}
                disabled={!participantId || !targetId || isDuplicate}
                sx={{ whiteSpace: "nowrap" }}
              >
                Add rule
              </Button>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
              <Typography variant="caption" color="text.secondary">
                {ruleDescriptions[kind]}
              </Typography>
              {(isDuplicate || ruleMessage) && (
                <Typography variant="caption" color="warning.main" fontWeight={700}>
                  {ruleMessage ?? "This rule is already active."}
                </Typography>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ mt: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
          <Typography variant="subtitle2">Active rules</Typography>
          <Chip size="small" label={`${constraints.length} rule${constraints.length === 1 ? "" : "s"}`} />
        </Stack>

        {constraints.length === 0 ? (
          <Box
            sx={{
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 3,
              p: 3,
              textAlign: "center",
              bgcolor: "#FAFAFC",
            }}
          >
            <Typography color="text.secondary" variant="body2">
              No private rules added. You can continue without any.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {constraints.map((constraint, index) => {
              const firstName = names[constraint.participant_id] ?? constraint.participant_id;
              const targetName = constraint.kind === "locked_room"
                ? roomNames[constraint.target_id] ?? constraint.target_id
                : names[constraint.target_id] ?? constraint.target_id;

              return (
                <Stack
                  key={`${constraint.kind}-${constraint.participant_id}-${constraint.target_id}-${index}`}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.25}
                  alignItems={{ sm: "center" }}
                  justifyContent="space-between"
                  sx={{
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2.5,
                    bgcolor: "background.paper",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Chip
                      label={ruleLabels[constraint.kind]}
                      size="small"
                      variant="outlined"
                      color={ruleColors[constraint.kind]}
                    />
                    <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                      {constraint.kind === "locked_room" ? (
                        <><strong>{firstName}</strong>{" → "}<strong>{targetName}</strong></>
                      ) : (
                        <><strong>{firstName}</strong>{" and "}<strong>{targetName}</strong></>
                      )}
                    </Typography>
                  </Stack>

                  <IconButton
                    size="small"
                    aria-label="Remove rule"
                    onClick={() => onConstraintsChange(constraints.filter((_, i) => i !== index))}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Box>
    </StepShell>
  );
}
