from jinja2 import Environment, FileSystemLoader
from fastapi_mail import FastMail, MessageSchema
import logging

from app.core.config import mail_config, BACKEND_URL


env = Environment(loader=FileSystemLoader("app/services/email_service/templates"))
template = env.get_template("verification_email.html")
password_reset_template = env.get_template("password_reset_email.html")

# Send verification email
async def send_verification_email(token: str, email: str, name: str):
    verification_link = f"{BACKEND_URL}/api/v1/auth/verify-page?token={token}"
    body = template.render(email=email, verification_link=verification_link, name=name)
    
    message = MessageSchema(
        subject="Verify your Tech_Pulse account",
        recipients=[email],
        cc=["support@techpulse.com"],
        bcc=["admin@techpulse.com"],
        reply_to=["support@techpulse.com"],
        body=body,
        subtype="html",
    )

    fm = FastMail(mail_config)
    await fm.send_message(message=message)
    logging.info("verification email sent to %s", email)


async def send_password_reset_email(token: str, email: str, name: str):
    reset_link = f"{BACKEND_URL}/api/v1/auth/password-reset/page?token={token}"
    body = password_reset_template.render(email=email, password_reset_link=reset_link, name=name)

    message = MessageSchema(
        subject="Reset your Tech_Pulse password",
        recipients=[email],
        body=body,
        subtype="html",
    )

    fm = FastMail(mail_config)
    await fm.send_message(message=message)
    logging.info("password reset email sent to %s", email)
        
