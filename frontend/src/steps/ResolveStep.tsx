import { useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import StepShell from "../components/StepShell";
import { dismissPreference, resolvePreference } from "../lib/api";
import type {
  Labels,
  Participant,
  UnresolvedPreference,
} from "../types";

export default function ResolveStep({
  labels,
  uploadId,
  participants,
  unresolved,
  onUnresolvedChange,
  onBack,
  onNext,
  onError,
}: {
  labels: Labels;
  uploadId: string;
  participants: Participant[];
  unresolved: UnresolvedPreference[];
  onUnresolvedChange: (items: UnresolvedPreference[]) => void;
  onBack: () => void;
  onNext: () => void;
  onError: (message: string) => void;
}) {
  const [manualSelections, setManualSelections] = useState<Record<string, Participant | null>>({});

  function itemKey(item: UnresolvedPreference) {
    return `${item.participant_id}-${item.rank ?? "u"}-${item.requested_name}`;
  }

  async function resolve(item: UnresolvedPreference, targetId: string) {
    try {
      const response = await resolvePreference(uploadId, {
        participant_id: item.participant_id,
        rank: item.rank,
        target_id: targetId,
      });

      onUnresolvedChange(response.unresolved_preferences);
      setManualSelections((current) => {
        const next = { ...current };
        delete next[itemKey(item)];
        return next;
      });
    } catch (error: any) {
      onError(error?.response?.data?.detail ?? "Could not resolve this preference.");
    }
  }

  async function dismiss(item: UnresolvedPreference) {
    try {
      const response = await dismissPreference(uploadId, {
        participant_id: item.participant_id,
        rank: item.rank,
        requested_name: item.requested_name,
      });

      onUnresolvedChange(response.unresolved_preferences);
    } catch (error: any) {
      onError(error?.response?.data?.detail ?? "Could not dismiss this preference.");
    }
  }

  return (
    <StepShell
      eyebrow="Data review"
      title="Review names we could not match"
      description={`We only auto-match exact names. This keeps the system from silently assigning a ${labels.preference.toLowerCase()} to the wrong person.`}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={unresolved.length > 0}
    >
      {unresolved.length === 0 ? (
        <Alert
          icon={<CheckCircleRoundedIcon />}
          severity="success"
          sx={{ borderRadius: 3 }}
        >
          All preference names are resolved. You can continue.
        </Alert>
      ) : (
        <Stack spacing={2}>
          {unresolved.map((item, index) => {
            const key = itemKey(item);
            const manualSelection = manualSelections[key] ?? null;
            const availableParticipants = participants.filter(
              (participant) => participant.participant_id !== item.participant_id,
            );

            return (
              <Card key={`${key}-${index}`}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={2.5}
                  >
                    <Box sx={{ minWidth: 220 }}>
                      <Typography variant="body2" color="text.secondary">
                        {item.participant_name} requested
                      </Typography>
                      <Typography variant="h6">
                        “{item.requested_name}”
                      </Typography>
                      {item.rank && (
                        <Chip
                          size="small"
                          label={`Rank ${item.rank}`}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>

                    <Box sx={{ flex: 1, maxWidth: 700 }}>
                      {item.suggestions.length > 0 && (
                        <>
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>
                            SUGGESTED MATCHES
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                            alignItems="center"
                            sx={{ mt: 1 }}
                          >
                            {item.suggestions.map((suggestion) => (
                              <Button
                                key={suggestion.participant_id}
                                variant="outlined"
                                onClick={() => resolve(item, suggestion.participant_id)}
                                sx={{ textAlign: "left" }}
                              >
                                <Stack spacing={0} alignItems="flex-start">
                                  <span>Use {suggestion.name}</span>
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    {Math.round(suggestion.score * 100)}% name similarity
                                  </Typography>
                                </Stack>
                              </Button>
                            ))}
                          </Stack>
                        </>
                      )}

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        FIND A DIFFERENT PERSON
                      </Typography>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ sm: "center" }}
                        sx={{ mt: 1 }}
                      >
                        <Autocomplete
                          size="small"
                          options={availableParticipants}
                          getOptionLabel={(option) => option.name}
                          value={manualSelection}
                          onChange={(_, value) =>
                            setManualSelections((current) => ({ ...current, [key]: value }))
                          }
                          sx={{ flex: 1, minWidth: 240 }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder={`Search ${labels.participantPlural.toLowerCase()}`}
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <>
                                    <SearchRoundedIcon sx={{ mr: 0.75, color: "text.secondary", fontSize: 20 }} />
                                    {params.InputProps.startAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                        />
                        <Button
                          variant="contained"
                          color="secondary"
                          disabled={!manualSelection}
                          onClick={() => manualSelection && resolve(item, manualSelection.participant_id)}
                        >
                          Confirm match
                        </Button>
                        <Button color="inherit" onClick={() => dismiss(item)}>
                          Dismiss request
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 3 }}
      >
        Imported {participants.length} {labels.participantPlural.toLowerCase()}.
      </Typography>
    </StepShell>
  );
}
