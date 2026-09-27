"""
Security foundation placeholder.
In Phase 1, authentication and authorization are deferred per spec boundaries.
This module establishes helper hooks for headers and sanitized responses.
"""

def sanitize_error_message(message: str) -> str:
    """Ensure secrets or internal stack traces are not leaked in error messages."""
    forbidden_terms = ["password", "secret", "key", "token", "postgres://", "redis://"]
    lower_msg = message.lower()
    for term in forbidden_terms:
        if term in lower_msg:
            return "An internal security error occurred."
    return message
