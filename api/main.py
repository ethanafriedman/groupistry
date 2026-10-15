
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router


app = FastAPI(
    title="Groupistry API",
    version="0.3.0",
    description=(
        "Import participant preference data, configure private admin rules, "
        "run a CP-SAT room/group optimizer, and export assignments."
    ),
)

# Development defaults for the React/Vite frontend.
# Lock this down to the deployed frontend origin in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "Groupistry API",
        "docs": "/docs",
        "health": "/api/health",
    }
