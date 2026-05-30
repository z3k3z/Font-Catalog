from pydantic import BaseModel, Field


class FrontendDiagnosticEvent(BaseModel):
    session_id: str = Field(description="Frontend page-session identifier.")
    session_started_at_utc: str = Field(description="UTC timestamp when the frontend session started.")
    event_type: str = Field(description="Diagnostic event type.")
    subject_key: str = Field(description="Logical event subject, such as font:123.")
    variant_key: str = Field(description="Variant/reason key used for frontend dedupe.")
    message: str = Field(description="Human-readable diagnostic message.")
    occurrence_count: int = Field(description="Number of occurrences represented by this event.")
    user_agent: str = Field(default="", description="Browser user-agent string.")
    page_url: str = Field(default="", description="Frontend page URL.")
    probe_level: str = Field(
        description="Requested backend probe level for this frontend diagnostic event."
    )
    frontend_call_site: str = Field(
        default="", description="Frontend JavaScript stack/call-site text captured at probe emission."
    )
