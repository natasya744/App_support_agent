from pathlib import Path
from dotenv import set_key
from google_auth_oauthlib.flow import InstalledAppFlow

# Project paths
BASE_DIR = Path(__file__).resolve().parent.parent
CREDENTIALS_FILE = BASE_DIR / "credentials.json"
ENV_FILE = BASE_DIR / ".env"

# OAuth scopes
SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]


def get_oauth_credentials():
    """Start local web server and authorize via browser."""
    flow = InstalledAppFlow.from_client_secrets_file(
        str(CREDENTIALS_FILE),
        scopes=SCOPES,
    )

    print("\nOpening browser for Google login...")
    print("If it doesn't open automatically, use the URL printed below.\n")

    # prompt="consent" forces Google to return a refresh_token
    return flow.run_local_server(
        port=0,
        access_type="offline",
        prompt="consent",
    )


def save_to_env(client_id: str, client_secret: str, refresh_token: str):
    """Save the obtained credentials directly to .env."""
    if not ENV_FILE.exists():
        return

    set_key(ENV_FILE, "GOOGLE_CLIENT_ID", client_id, quote_mode="never")
    set_key(ENV_FILE, "GOOGLE_CLIENT_SECRET", client_secret, quote_mode="never")
    set_key(ENV_FILE, "GOOGLE_REFRESH_TOKEN", refresh_token, quote_mode="never")
    print("Saved credentials to .env")


def main():
    # Step 1: Validate credentials.json exists
    if not CREDENTIALS_FILE.exists():
        print(f"Error: Missing credentials file at {CREDENTIALS_FILE}")
        return

    # Step 2: Authenticate in browser & get tokens
    creds = get_oauth_credentials()

    if not creds.refresh_token:
        print("\nWarning: No refresh token returned by Google.")
        print("Please remove app access at https://myaccount.google.com/connections and retry.")
        return

    # Step 3: Print credentials & save to .env
    print("\n--- Success! Credentials obtained ---")
    print(f"GOOGLE_CLIENT_ID={creds.client_id}")
    print(f"GOOGLE_CLIENT_SECRET={creds.client_secret}")
    print(f"GOOGLE_REFRESH_TOKEN={creds.refresh_token}\n")

    save_to_env(creds.client_id, creds.client_secret, creds.refresh_token)


if __name__ == "__main__":
    main()
