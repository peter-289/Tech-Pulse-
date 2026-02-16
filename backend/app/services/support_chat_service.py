from __future__ import annotations

import requests

from app.core.config import AI_API_KEY, AI_BASE_URL, SUPPORT_CHAT_MODEL
from app.core.unit_of_work import UnitOfWork
from app.exceptions.exceptions import ExternalServiceError, ValidationError
from app.models.chat_message import ChatMessage


class SupportChatService:
    SYSTEM_PROMPT = (
        "You are Tech Pulse customer support. "
        "Be concise, accurate, and provide actionable troubleshooting steps. "
        "If a request involves account security, advise the user to contact an administrator."
    )

    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def ask(self, *, user_id: int, message: str) -> ChatMessage:
        cleaned = (message or "").strip()
        if len(cleaned) < 2:
            raise ValidationError("Message is too short")

        assistant_reply = self._generate_reply(cleaned)

        chat_message = ChatMessage(
            user_id=user_id,
            role="assistant",
            user_message=cleaned,
            assistant_message=assistant_reply,
        )
        with self.uow:
            return self.uow.chat_message_repo.add(chat_message)

    def list_messages(self, *, user_id: int, limit: int = 25) -> list[ChatMessage]:
        with self.uow:
            return self.uow.chat_message_repo.list_for_user(user_id=user_id, limit=limit)

    def _generate_reply(self, message: str) -> str:
        if not AI_API_KEY:
            return (
                "Support assistant is in fallback mode. "
                "Please include your issue details, expected behavior, and any error message."
            )

        url = f"{AI_BASE_URL.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {AI_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": SUPPORT_CHAT_MODEL,
            "temperature": 0.2,
            "messages": [
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": message},
            ],
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=60)
        except requests.RequestException as exc:
            raise ExternalServiceError("Failed to reach AI support service") from exc

        if response.status_code >= 400:
            raise ExternalServiceError(f"AI support service failed: {response.text[:200]}")

        data = response.json()
        choices = data.get("choices") or []
        content = (
            choices[0].get("message", {}).get("content").strip()
            if choices and choices[0].get("message")
            else ""
        )
        if not content:
            raise ExternalServiceError("AI support service returned an empty response")
        return content

