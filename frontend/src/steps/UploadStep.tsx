import { useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";

import StepShell from "../components/StepShell";
import { uploadFile } from "../lib/api";
import type { Labels, UploadPreview } from "../types";

export default function UploadStep({
  labels,
  upload,
  onUpload,
  onBack,
  onNext,
  onError,
}: {
  labels: Labels;
  upload: UploadPreview | null;
  onUpload: (upload: UploadPreview) => void;
  onBack: () => void;
  onNext: () => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["csv", "xlsx", "xlsm"].includes(extension)) {
      onError("Choose a CSV, XLSX, or XLSM file.");
      return;
    }

    setLoading(true);
    try {
      onUpload(await uploadFile(file));
    } catch (error: any) {
      onError(error?.response?.data?.detail ?? "Could not upload this file.");
    } finally {
      setLoading(false);
    }
  }

  const previewColumns = upload?.columns.slice(0, 6) ?? [];
  const previewRows = upload?.preview.slice(0, 5) ?? [];

  return (
    <StepShell
      eyebrow="Data import"
      title={`Upload your ${labels.participantPlural.toLowerCase()} list`}
      description={`Import the spreadsheet containing names and ${labels.preferencePlural.toLowerCase()}. Groupistry will show a preview before you map any columns.`}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!upload || loading}
    >
      <input
        ref={inputRef}
        hidden
        type="file"
        accept=".csv,.xlsx,.xlsm"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <Box
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        sx={{
          border: "1.5px dashed",
          borderColor: dragging ? "secondary.main" : "#C9CED8",
          borderRadius: 3.5,
          p: { xs: 4, md: 6 },
          textAlign: "center",
          cursor: loading ? "default" : "pointer",
          bgcolor: dragging ? "secondary.light" : "#FAFAFC",
          transition: "160ms ease",
          "&:hover": {
            borderColor: "secondary.main",
            bgcolor: "#F8F8FF",
          },
        }}
      >
        <Box
          sx={{
            width: 54,
            height: 54,
            borderRadius: 3,
            display: "grid",
            placeItems: "center",
            bgcolor: "secondary.light",
            color: "secondary.main",
            mx: "auto",
          }}
        >
          <UploadFileRoundedIcon sx={{ fontSize: 30 }} />
        </Box>
        <Typography variant="h6" sx={{ mt: 1.75 }}>
          {loading ? "Uploading your file…" : "Drop a spreadsheet here"}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.65 }}>
          or choose a file from your computer · CSV, XLSX, or XLSM
        </Typography>
        <Button variant="outlined" color="secondary" sx={{ mt: 2.25 }} disabled={loading}>
          Choose file
        </Button>
      </Box>

      {upload && (
        <Box
          sx={{
            mt: 3,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ p: 2.25 }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <DescriptionOutlinedIcon color="secondary" />
              <Box>
                <Typography fontWeight={700}>{upload.filename}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {upload.row_count} rows · {upload.columns.length} columns
                </Typography>
              </Box>
            </Stack>
            <Chip icon={<CheckCircleRoundedIcon />} color="success" label="Ready to map" />
          </Stack>
          <Divider />
          <Box sx={{ p: 2.25, bgcolor: "#FAFAFC" }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              DETECTED COLUMNS
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
              {upload.columns.slice(0, 8).map((column) => (
                <Chip key={column} size="small" variant="outlined" label={column} />
              ))}
              {upload.columns.length > 8 && (
                <Chip size="small" label={`+${upload.columns.length - 8} more`} />
              )}
            </Stack>
          </Box>

          {previewRows.length > 0 && (
            <>
              <Divider />
              <Box sx={{ p: 2.25 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.25 }}>
                  <Typography variant="subtitle2">Data preview</Typography>
                  <Typography variant="caption" color="text.secondary">
                    First {previewRows.length} row{previewRows.length === 1 ? "" : "s"}
                  </Typography>
                </Stack>
                <TableContainer
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2.5,
                    bgcolor: "background.paper",
                    maxWidth: "100%",
                  }}
                >
                  <Table size="small" sx={{ minWidth: 640 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#FAFAFC" }}>
                        {previewColumns.map((column) => (
                          <TableCell key={column} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                            {column}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewRows.map((row, rowIndex) => (
                        <TableRow key={rowIndex} hover>
                          {previewColumns.map((column) => (
                            <TableCell key={column} sx={{ color: "text.secondary", maxWidth: 220 }}>
                              <Typography variant="body2" noWrap title={String(row[column] ?? "")}>
                                {String(row[column] ?? "") || "—"}
                              </Typography>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {upload.columns.length > previewColumns.length && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    Showing the first {previewColumns.length} of {upload.columns.length} columns.
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Box>
      )}
    </StepShell>
  );
}
