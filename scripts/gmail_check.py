import sys
import time
from pathlib import Path

# Ensure project root is in Python path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.gmail import Gmail, PROCESSED_LABEL, get_body, get_headers


def main():
    print("=" * 60)
    print(" Gmail Support Agent Checker")
    print("=" * 60)

    try:
        gmail = Gmail()
        print(f"[✓] Connected to Gmail as: {gmail.address}")
    except Exception as e:
        print(f"[ERROR] Failed to connect to Gmail: {e}")
        return

    print(f"\nScanning for new messages (in:inbox -label:{PROCESSED_LABEL})...")
    message_ids = gmail.list_new_message_ids(max_results=5)

    if not message_ids:
        print("\n[!] No new unprocessed messages found in the inbox.")
        print(f"    - Make sure you sent an email to: {gmail.address}")
        print("    - Check your Spam/Trash/Updates folder if the email was filtered.")
        print(f"    - If you previously processed it, it now has the '{PROCESSED_LABEL}' label.")
        return

    print(f"[✓] Found {len(message_ids)} unprocessed message(s).\n")

    # Process the most recent message
    message_id = message_ids[0]
    message = gmail.get_message(message_id)
    headers = get_headers(message)

    sender = headers.get("from", "Unknown sender")
    subject = headers.get("subject", "(no subject)")
    body = get_body(message).strip()

    print("-" * 60)
    print(f"Message ID: {message_id}")
    print(f"From:       {sender}")
    print(f"Subject:    {subject}")
    print("Body preview:")
    print(body[:300] + ("..." if len(body) > 300 else ""))
    print("-" * 60)

    # Check if the user sent a test email to themselves
    if gmail.address.lower() in sender.lower():
        print("\n[NOTE] You sent this email to yourself.")
        print("In Gmail, replies sent to your own address stay in the same thread")
        print("and will not appear as a separate new unread notification.\n")

    # Send auto-reply
    reply_text = "Thanks, we received your email. Our support team is looking into it."
    print("Sending reply...")
    gmail.send_reply(message, reply_text)
    print("[✓] Reply sent successfully!")

    # Mark the message as processed so it won't be processed again
    gmail.add_label(message_id, PROCESSED_LABEL)
    print(f"[✓] Added label '{PROCESSED_LABEL}' to message.\n")


if __name__ == "__main__":
    main()
