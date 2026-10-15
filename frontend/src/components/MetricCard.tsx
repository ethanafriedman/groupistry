import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

export default function MetricCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note?: string;
  icon?: ReactNode;
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.6 }}>
              {value}
            </Typography>
          </Box>
          {icon && (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                bgcolor: "secondary.light",
                color: "secondary.main",
              }}
            >
              {icon}
            </Box>
          )}
        </Stack>
        {note && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            {note}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
