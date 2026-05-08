import httpx
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from discord_webhook import DiscordWebhook, DiscordEmbed
from typing import Dict, Any
from app.config import settings
from app.models.models import Alert, AlertType
from sqlalchemy.orm import Session
from datetime import datetime


class NotificationSender:
    """Service to send notifications via different channels"""
    
    @staticmethod
    async def send_webhook(url: str, alert: Alert, db: Session) -> Dict[str, Any]:
        """Send webhook notification"""
        try:
            payload = {
                "alert_id": alert.id,
                "feed": {
                    "id": alert.feed.id,
                    "name": alert.feed.name,
                    "type": alert.feed.feed_type.value,
                    "url": alert.feed.url
                },
                "keyword": {
                    "id": alert.keyword.id,
                    "name": alert.keyword.name or alert.keyword.keyword,
                    "keyword": alert.keyword.keyword
                },
                "matched_content": alert.matched_content,
                "context": alert.context,
                "triggered_at": alert.triggered_at.isoformat()
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
            
            return {
                "success": True,
                "message": "Webhook sent successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    async def send_email(to_email: str, alert: Alert, db: Session) -> Dict[str, Any]:
        """Send email notification"""
        try:
            if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
                return {
                    "success": False,
                    "error": "SMTP credentials not configured"
                }
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = f"Dark Web Alert: Keyword '{alert.keyword.name or alert.keyword.keyword}' detected"
            message["From"] = settings.SMTP_FROM
            message["To"] = to_email
            
            # Create HTML content
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2 style="color: #dc3545;">🚨 Dark Web Alert Triggered</h2>
                    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 10px 0;">
                        <h3>Alert Details</h3>
                        <p><strong>Keyword:</strong> {alert.keyword.name or alert.keyword.keyword}</p>
                        <p><strong>Feed:</strong> {alert.feed.name} ({alert.feed.feed_type.value})</p>
                        <p><strong>URL:</strong> {alert.feed.url}</p>
                        <p><strong>Triggered:</strong> {alert.triggered_at.strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                    </div>
                    <div style="background-color: #fff3cd; padding: 15px; margin: 10px 0;">
                        <h3>Matched Content</h3>
                        <p><strong>{alert.matched_content}</strong></p>
                    </div>
                    <div style="background-color: #f8f9fa; padding: 15px; margin: 10px 0;">
                        <h3>Context</h3>
                        <p>{alert.context if alert.context else 'No context available'}</p>
                    </div>
                    <hr>
                    <p style="color: #6c757d; font-size: 12px;">
                        This is an automated alert from Dark Web Alert monitoring system.
                    </p>
                </body>
            </html>
            """
            
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Send email
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                start_tls=True
            )
            
            return {
                "success": True,
                "message": "Email sent successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    async def send_discord(webhook_url: str, alert: Alert, db: Session) -> Dict[str, Any]:
        """Send Discord webhook notification"""
        try:
            webhook = DiscordWebhook(url=webhook_url, rate_limit_retry=True)
            
            # Create embed
            embed = DiscordEmbed(
                title="🚨 Dark Web Alert Triggered",
                color='dc3545',
                description=f"Keyword **{alert.keyword.name or alert.keyword.keyword}** detected"
            )
            
            embed.add_embed_field(
                name="Feed",
                value=f"{alert.feed.name} ({alert.feed.feed_type.value})",
                inline=False
            )
            
            embed.add_embed_field(
                name="URL",
                value=alert.feed.url,
                inline=False
            )
            
            embed.add_embed_field(
                name="Matched Content",
                value=f"```{alert.matched_content[:200]}```",
                inline=False
            )
            
            if alert.context:
                embed.add_embed_field(
                    name="Context",
                    value=alert.context[:500] + ("..." if len(alert.context) > 500 else ""),
                    inline=False
                )
            
            embed.set_footer(text=f"Triggered at {alert.triggered_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
            embed.set_timestamp(alert.triggered_at)
            
            webhook.add_embed(embed)
            response = webhook.execute()
            
            if response.status_code in [200, 204]:
                return {
                    "success": True,
                    "message": "Discord notification sent successfully"
                }
            else:
                return {
                    "success": False,
                    "error": f"Discord API returned status code {response.status_code}"
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    async def send_teams(webhook_url: str, alert: Alert, db: Session) -> Dict[str, Any]:
        """Send Microsoft Teams webhook notification using Adaptive Card format with @mention"""
        try:
            matched_text = alert.matched_content[:500] if alert.matched_content else "N/A"
            context_text = ""
            if alert.context:
                context_text = alert.context[:1000] + ("..." if len(alert.context) > 1000 else "")

            # Build Adaptive Card body
            body = [
                {
                    "type": "TextBlock",
                    "size": "large",
                    "weight": "bolder",
                    "color": "attention",
                    "text": "\U0001f6a8 Threat Intel Alert"
                },
                {
                    "type": "TextBlock",
                    "text": f"Keyword **{alert.keyword.name or alert.keyword.keyword}** detected!",
                    "wrap": True
                },
                {
                    "type": "FactSet",
                    "facts": [
                        {"title": "Keyword", "value": alert.keyword.name or alert.keyword.keyword},
                        {"title": "Feed", "value": f"{alert.feed.name} ({alert.feed.feed_type.value})"},
                        {"title": "URL", "value": alert.feed.url},
                        {"title": "Triggered", "value": alert.triggered_at.strftime('%Y-%m-%d %H:%M:%S UTC')},
                    ]
                },
                {
                    "type": "TextBlock",
                    "text": "**Matched Content**",
                    "weight": "bolder",
                    "spacing": "medium"
                },
                {
                    "type": "TextBlock",
                    "text": matched_text,
                    "wrap": True
                },
            ]

            # Add context block if available
            if context_text:
                body.append({
                    "type": "TextBlock",
                    "text": "**Context**",
                    "weight": "bolder",
                    "spacing": "medium"
                })
                body.append({
                    "type": "TextBlock",
                    "text": context_text,
                    "wrap": True
                })

            payload = {
                "type": "message",
                "attachments": [
                    {
                        "contentType": "application/vnd.microsoft.card.adaptive",
                        "contentUrl": None,
                        "content": {
                            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                            "type": "AdaptiveCard",
                            "version": "1.4",
                            "body": body
                        }
                    }
                ]
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()

            return {
                "success": True,
                "message": "Teams notification sent successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    @staticmethod
    async def send_notification(
        notification_type: AlertType,
        destination: str,
        alert: Alert,
        db: Session
    ) -> Dict[str, Any]:
        """Main function to send notifications based on type"""
        if notification_type == AlertType.WEBHOOK:
            return await NotificationSender.send_webhook(destination, alert, db)
        elif notification_type == AlertType.EMAIL:
            return await NotificationSender.send_email(destination, alert, db)
        elif notification_type == AlertType.DISCORD:
            return await NotificationSender.send_discord(destination, alert, db)
        elif notification_type == AlertType.TEAMS:
            return await NotificationSender.send_teams(destination, alert, db)
        else:
            return {
                "success": False,
                "error": f"Unknown notification type: {notification_type}"
            }
