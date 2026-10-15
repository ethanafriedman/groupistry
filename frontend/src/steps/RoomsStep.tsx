import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";

import StepShell from "../components/StepShell";
import { makeEqualRooms } from "../lib/api";
import type { Labels, Participant, Room } from "../types";

export default function RoomsStep({
  labels,
  uploadId,
  participants,
  rooms,
  onRoomsChange,
  onBack,
  onNext,
  onError,
}: {
  labels: Labels;
  uploadId: string;
  participants: Participant[];
  rooms: Room[];
  onRoomsChange: (rooms: Room[]) => void;
  onBack: () => void;
  onNext: () => void;
  onError: (message: string) => void;
}) {
  const [capacity, setCapacity] = useState(4);

  async function generateEqualRooms() {
    try {
      onRoomsChange(await makeEqualRooms(uploadId, capacity));
    } catch (error: any) {
      onError(error?.response?.data?.detail ?? "Could not create groups.");
    }
  }

  const totalCapacity = rooms.reduce(
    (sum, room) => sum + Number(room.capacity || 0),
    0,
  );
  const spareCapacity = totalCapacity - participants.length;
  const enoughCapacity = totalCapacity >= participants.length;

  return (
    <StepShell
      eyebrow="Capacity planning"
      title={`Configure your ${labels.roomPlural.toLowerCase()}`}
      description={`Set a standard capacity or customize individual ${labels.roomPlural.toLowerCase()}. Capacity is a hard constraint, so the optimizer will never place more people than a ${labels.room.toLowerCase()} allows.`}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={rooms.length === 0 || !enoughCapacity}
    >
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <PeopleAltOutlinedIcon color="secondary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">Participants</Typography>
                  <Typography variant="h5">{participants.length}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <MeetingRoomOutlinedIcon color="secondary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">Total capacity</Typography>
                  <Typography variant="h5">{totalCapacity}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: "100%", borderColor: rooms.length > 0 ? (enoughCapacity ? "success.main" : "warning.main") : "divider" }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <EventAvailableOutlinedIcon color={rooms.length > 0 && enoughCapacity ? "success" : "action"} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Open spots</Typography>
                  <Typography variant="h5">{Math.max(spareCapacity, 0)}</Typography>
                  {rooms.length > 0 && (
                    <Typography variant="caption" color={enoughCapacity ? "success.main" : "warning.main"} fontWeight={700}>
                      {enoughCapacity ? "Capacity sufficient" : `${Math.abs(spareCapacity)} more needed`}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, bgcolor: "#FAFAFC" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "center" }}
            justifyContent="space-between"
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
              <TextField
                type="number"
                label={`People per ${labels.room.toLowerCase()}`}
                value={capacity}
                onChange={(event) => setCapacity(Math.max(1, Number(event.target.value)))}
                inputProps={{ min: 1 }}
                sx={{ width: { xs: "100%", sm: 220 } }}
              />
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AutoFixHighRoundedIcon />}
                onClick={generateEqualRooms}
              >
                Auto-create groups
              </Button>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
              Groupistry will create the minimum number of equal-capacity groups needed for everyone.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {rooms.length > 0 && (
        <Stack spacing={1.25}>
          {rooms.map((room, index) => (
            <Box
              key={room.room_id}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 88px 42px", sm: "1fr 130px 42px" },
                gap: 1.25,
                alignItems: "center",
                p: 1.25,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2.5,
                bgcolor: "background.paper",
              }}
            >
              <TextField
                label={`${labels.room} name`}
                value={room.name}
                onChange={(event) => {
                  const next = [...rooms];
                  next[index] = { ...room, name: event.target.value };
                  onRoomsChange(next);
                }}
              />

              <TextField
                type="number"
                label="Capacity"
                value={room.capacity}
                onChange={(event) => {
                  const next = [...rooms];
                  next[index] = {
                    ...room,
                    capacity: Math.max(1, Number(event.target.value)),
                  };
                  onRoomsChange(next);
                }}
                inputProps={{ min: 1 }}
              />

              <IconButton
                aria-label={`Delete ${room.name}`}
                onClick={() => onRoomsChange(rooms.filter((_, i) => i !== index))}
              >
                <DeleteOutlineRoundedIcon />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}

      <Button
        variant="outlined"
        startIcon={<AddRoundedIcon />}
        color="secondary"
        sx={{ mt: 2 }}
        onClick={() => {
          const nextNumber = rooms.length + 1;
          onRoomsChange([
            ...rooms,
            {
              room_id: `R${String(nextNumber).padStart(3, "0")}`,
              name: `${labels.room} ${nextNumber}`,
              capacity,
              attributes: {},
            },
          ]);
        }}
      >
        Add {labels.room.toLowerCase()}
      </Button>

      <Alert
        severity={rooms.length === 0 ? "info" : enoughCapacity ? "success" : "warning"}
        variant="outlined"
        sx={{ mt: 3 }}
      >
        <Typography variant="body2">
          {rooms.length === 0 ? (
            <>Create at least one {labels.room.toLowerCase()} to continue.</>
          ) : (
            <>
              <strong>{totalCapacity}</strong> total spots for <strong>{participants.length}</strong>{" "}
              {labels.participantPlural.toLowerCase()}.
              {enoughCapacity
                ? ` ${spareCapacity} spare spot${spareCapacity === 1 ? "" : "s"} available.`
                : ` Add ${Math.abs(spareCapacity)} more spot${Math.abs(spareCapacity) === 1 ? "" : "s"} before continuing.`}
            </>
          )}
        </Typography>
      </Alert>
    </StepShell>
  );
}
