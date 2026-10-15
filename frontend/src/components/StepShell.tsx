import type { ReactNode } from "react";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

interface Props {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  footer?: ReactNode;
}

export default function StepShell({
  eyebrow,
  title,
  description,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  footer,
}: Props) {
  return (
    <Box>
      <Box sx={{ maxWidth: 820 }}>
        {eyebrow && (
          <Typography
            variant="overline"
            sx={{
              color: "secondary.main",
              fontWeight: 800,
              letterSpacing: ".12em",
              lineHeight: 1.4,
            }}
          >
            {eyebrow}
          </Typography>
        )}

        <Typography variant="h4" sx={{ mt: 0.5 }}>
          {title}
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 1.25, maxWidth: 760, lineHeight: 1.7 }}
        >
          {description}
        </Typography>
      </Box>

      <Box sx={{ mt: { xs: 3, md: 4 } }}>{children}</Box>

      <Divider sx={{ mt: { xs: 4, md: 5 }, mb: 2.5 }} />

      <Stack
        direction={{ xs: "column-reverse", sm: "row" }}
        justifyContent="space-between"
        spacing={2}
        alignItems={{ sm: "center" }}
      >
        <Box>
          {onBack && (
            <Button
              variant="text"
              color="inherit"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={onBack}
            >
              Back
            </Button>
          )}
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          alignItems={{ sm: "center" }}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          {footer}
          {onNext && (
            <Button
              variant="contained"
              color="secondary"
              endIcon={<ArrowForwardRoundedIcon />}
              disabled={nextDisabled}
              onClick={onNext}
              sx={{ minWidth: 138 }}
            >
              {nextLabel}
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
