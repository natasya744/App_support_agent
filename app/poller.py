import logging
import time

from app.config import settings
from app.gmail import Gmail
from app.pipeline import handle_message

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s"
)
logger = logging.getLogger("poller")

# How many consecutive errors before we re-create the Gmail client
# (handles token expiry + SSL hiccups without crashing the whole poller).
_MAX_GMAIL_ERRORS = 3


def poll_once(gmail: Gmail) -> int:
    message_ids = gmail.list_new_message_ids()
    for message_id in message_ids:
        try:
            handle_message(gmail, message_id)
        except Exception:
            # One bad email must not stop the loop.
            logger.exception("Failed to process %s", message_id)
    return len(message_ids)


def main() -> None:
    logger.info("Polling every %s seconds", settings.poll_interval_seconds)
    gmail: Gmail | None = None
    consecutive_errors = 0

    while True:
        try:
            # Build the Gmail client once; rebuild only after repeated failures
            # (e.g. token expiry, transient SSL EOF) to avoid reconnecting every poll.
            if gmail is None:
                logger.info("Connecting to Gmail...")
                gmail = Gmail()
                logger.info("Connected as %s", gmail.address)
                consecutive_errors = 0

            count = poll_once(gmail)
            consecutive_errors = 0
            if count:
                logger.info("Handled %s new messages", count)

        except Exception:
            consecutive_errors += 1
            logger.exception(
                "Poll failed (error %d/%d)", consecutive_errors, _MAX_GMAIL_ERRORS
            )
            if consecutive_errors >= _MAX_GMAIL_ERRORS:
                logger.warning("Too many errors — reconnecting Gmail client next cycle")
                gmail = None
                consecutive_errors = 0

        time.sleep(settings.poll_interval_seconds)


if __name__ == "__main__":
    main()
