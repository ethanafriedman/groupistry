import { useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";

import StepShell from "../components/StepShell";
import { importUpload } from "../lib/api";
import type { Labels, UploadPreview } from "../types";

export default function MappingStep({
  labels,
  upload,
  ranked,
  onRankedChange,
  onImported,
  onBack,
  onNext,
  onError,
}: {
  labels: Labels;
  upload: UploadPreview;
  ranked: boolean;
  onRankedChange: (value: boolean) => void;
  onImported: (data: any) => void;
  onBack: () => void;
  onNext: () => void;
  onError: (message: string) => void;
}) {
  const [nameColumn, setNameColumn] = useState("");
  const [preferenceColumns, setPreferenceColumns] = useState<string[]>([]);
  const [idColumn, setIdColumn] = useState("");
  const [notesColumn, setNotesColumn] = useState("");
  const [loading, setLoading] = useState(false);

  const likelyName = useMemo(
    () =>
      upload.columns.find((column) =>
        ["name", "student name", "participant", "full name"].includes(
          column.toLowerCase(),
        ),
      ),
    [upload.columns],
  );

  async function handleNext() {
    const finalName = nameColumn || likelyName || "";

    if (!finalName || preferenceColumns.length === 0) {
      onError("Choose a name column and at least one preference column.");
      return;
    }

    setLoading(true);

    try {
      const data = await importUpload(
        upload.upload_id,
        {
          name_column: finalName,
          preference_columns: preferenceColumns,
          id_column: idColumn || null,
          notes_column: notesColumn || null,
          attribute_columns: {},
        },
        ranked,
      );

      onImported(data);
      onNext();
    } catch (error: any) {
      onError(error?.response?.data?.detail ?? "Could not import the file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StepShell
      eyebrow="Map columns"
      title="Tell us what each column means"
      description="Your spreadsheet can use any headers. Map the required participant and request fields first, then add optional identifiers or notes if they are available."
      onBack={onBack}
      onNext={handleNext}
      nextLabel={loading ? "Importing…" : "Import data"}
      nextDisabled={loading}
    >
      <Box
        sx={{
          p: 2.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          bgcolor: "#FAFAFC",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          <CheckCircleOutlineRoundedIcon color="secondary" sx={{ fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={750}>Required fields</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Groupistry needs one participant-name column and at least one request column.
        </Typography>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={5}>
            <TextField
              select
              fullWidth
              label={`${labels.participant} name column`}
              value={nameColumn || likelyName || ""}
              onChange={(event) => setNameColumn(event.target.value)}
            >
              {upload.columns.map((column) => (
                <MenuItem key={column} value={column}>
                  {column}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={7}>
            <Autocomplete
              multiple
              options={upload.columns}
              value={preferenceColumns}
              onChange={(_, value) => setPreferenceColumns(value)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={ranked ? `Rank ${index + 1} · ${option}` : option}
                    color={ranked ? "secondary" : "default"}
                    variant={ranked ? "outlined" : "filled"}
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={labels.preferencePlural}
                  placeholder="Select request columns in order"
                />
              )}
            />
          </Grid>
        </Grid>

        {ranked && preferenceColumns.length > 0 && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
            {preferenceColumns.map((column, index) => (
              <Box
                key={column}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.25,
                  py: 0.8,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "background.paper",
                }}
              >
                <Typography variant="caption" color="secondary.main" fontWeight={800}>
                  #{index + 1}
                </Typography>
                <Typography variant="body2" fontWeight={650}>{column}</Typography>
              </Box>
            ))}
          </Stack>
        )}

        <FormControlLabel
          sx={{ mt: 2 }}
          control={
            <Checkbox
              checked={ranked}
              onChange={(event) => onRankedChange(event.target.checked)}
            />
          }
          label={`${labels.preferencePlural} are ranked in order`}
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -0.5 }}>
          When enabled, the first selected request column is rank 1, the second is rank 2, and so on.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Typography variant="subtitle1" fontWeight={750}>Optional fields</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, mb: 2 }}>
          These fields can help with record keeping but are not required to optimize assignments.
        </Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="ID column"
              value={idColumn}
              onChange={(event) => setIdColumn(event.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {upload.columns.map((column) => (
                <MenuItem key={column} value={column}>
                  {column}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Notes column"
              value={notesColumn}
              onChange={(event) => setNotesColumn(event.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {upload.columns.map((column) => (
                <MenuItem key={column} value={column}>
                  {column}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Box>
    </StepShell>
  );
}
