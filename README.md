# Gmail Automation Tests (Playwright + JavaScript)

This repository contains automated tests for Gmail using **Playwright** with **JavaScript**.
The tests cover login, email navigation, composing, sending emails, and logout. Both positive and negative scenarios are included.

---

## Project Structure

```
gmail-automation/
├── config/
│   └── config.json        # Credentials and test data
├── tests/
│   └── gmail.spec.js      # Test scripts
├── videos/                # Playwright test videos
├── .gitignore
├── package.json
├── playwright.config.js
└── README.md
```

---

## Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/gmail-automation.git
cd gmail-automation
```

2. Install dependencies:

```bash
npm install
```

3. Add your test data in `config/config.json`:

```json
{
  "validUser": {
    "email": "your-email@gmail.com",
    "password": "your-password"
  },
  "invalidUser": {
    "email": "wrong-email@gmail.com",
    "password": "wrong-password"
  },
  "emails": [
    {
      "recipient": "recipient1@gmail.com",
      "subject": "Test Email 1",
      "body": "Hello from Playwright!"
    },
    {
      "recipient": "recipient2@gmail.com",
      "subject": "Test Email 2",
      "body": "Another test email"
    }
  ]
}
```

---

## Running Tests

Run **all tests**:

```bash
npx playwright test
```

Run a **specific test**:

```bash
npx playwright test -g "Login with valid credentials"
```

---

## Video Recording

* Each test automatically records a video saved in `/videos/`.
* Videos are renamed according to the test case name.

---

## Positive Scenarios

1. Login with valid credentials → Inbox loads successfully.
2. Compose and send an email → Confirmation appears.
3. Compose email with missing subject → Gmail allows sending.
4. Compose multiple emails → Each email is sent successfully.

---

## Negative Scenarios

1. Login with invalid credentials → Error message displayed.
2. Compose email without recipient → Gmail prevents sending.

---

## Notes

* Gmail may require "Less secure app access" or an app-specific password for automation accounts.
* Tests reuse login session (`gmailState.json`) to avoid repeated logins.

---

## License

This project is for testing and educational purposes.
