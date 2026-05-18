# Contact form

A built-in form handler + SMTP email pipeline. No external service, no composer dep, no Formspree-style middleman. Configure SMTP under **Settings → Email**, drop the bundled `templates/contact.twig` into a page (or render `{{ contact_form()|raw }}` from any template), and you're done.

## What ships

- A public endpoint at `POST /submit/<form>`.
- A bundled `contact` form with three fields (name, email, message) configured by default.
- An SMTP client that talks to every transactional provider via the standard ports.
- A submissions inbox at `/admin/settings/submissions` so you can review what came in even if email fails.
- Per-form on-disk storage at `site/data/submissions/`, included in backups.

## Configuring SMTP

**Settings → Email.**

The form has two cards: **SMTP** and **Contact form**. Fill in the SMTP card:

| Field | Examples |
|---|---|
| Host | `smtp.postmarkapp.com`, `smtp.mailgun.org`, `smtp.sendgrid.net`, `email-smtp.us-east-1.amazonaws.com`, `smtp.gmail.com`, `smtp.office365.com` |
| Port | `587` for TLS / STARTTLS (the normal case). `465` for SSL. |
| Encryption | **TLS** for port 587. **SSL** for port 465. **None** for unencrypted relays (local dev only). |
| Username | Provider-specific. Postmark: server token. SendGrid: literal `apikey`. SES: SMTP credentials from IAM. Gmail: full email address with an [app password](https://myaccount.google.com/apppasswords). |
| Password | Same. The field shows `(unchanged)` once a password is stored — type a new value to replace it. |
| From address | The `From:` header. Must be a verified sender at your provider, or DKIM-aligned with your domain, or the message will land in spam. |
| From name | Display name. `"Your Site"`. |
| Fall back to PHP `mail()` | Convenience for hobby hosts. Off by default. With it on, an SMTP failure silently falls through to `mail()`; deliverability is poor but recipients sometimes still see the message. |

Click **Send a test email**. The diagnostic panel right below the form returns the SMTP transport verbatim — including any error code like `535 5.7.8 Username and Password not accepted` — so you can fix auth issues without digging through server logs.

### Keeping the password off disk

Site config is JSON on disk. If you'd rather not commit your SMTP password to `site/config.json`, leave the password field empty in the UI and define a PHP constant in `config.php` instead:

```php
define('MD_SMTP_PASS', 'your-real-password');
```

`ServiceFactory::mailer()` reads `MD_SMTP_PASS` whenever the JSON value is blank. Mirrors how `MD_ADMIN_PASS_HASH` works.

### Provider quick-reference

| Provider | Host | Port | User | Pass | Encryption |
|---|---|---|---|---|---|
| **Postmark** | `smtp.postmarkapp.com` | `587` | server token | same as user | TLS |
| **Mailgun** | `smtp.mailgun.org` | `587` | from Mailgun dashboard | from dashboard | TLS |
| **SendGrid** | `smtp.sendgrid.net` | `587` | literal `apikey` | API key | TLS |
| **Amazon SES** | `email-smtp.<region>.amazonaws.com` | `587` | IAM SMTP creds | IAM SMTP creds | TLS |
| **Gmail** | `smtp.gmail.com` | `587` | full email address | [app password](https://myaccount.google.com/apppasswords) | TLS |
| **Microsoft 365** | `smtp.office365.com` | `587` | full email address | account password (modern auth disabled) or app password | TLS |
| **Custom relay** | whatever your VPS / hosting exposes | usually 587 or 25 | optional | optional | TLS / none |

OAuth2 / XOAUTH2 is **not** supported in v1. Use a transactional provider or an app password. Modern Gmail / Microsoft accounts often require app passwords now — that's normal.

## Configuring the contact form

The same screen has a **Contact form** card.

- **Send to** — where notifications land. Required for email delivery.
- **Subject prefix** — prepended to every subject line (`[Contact]` by default).
- **Rate limit / hour / IP** — 5 by default. Set to `0` to disable.
- **Success redirect** — where to send the user after a successful submission. The bundled `contact.twig` reads `?sent=1` from the URL to render a thank-you banner.
- **Store every submission on disk** — when off, only email delivery runs; submissions don't persist anywhere.

### Fields

The bundled defaults are:

```
name      (text,     required, "Your name")
email     (email,    required, "Email address")
message   (textarea, required, "Message")
```

Click **+ Add field** to add another. Each row has:

| Control | Notes |
|---|---|
| Name | The `$_POST` key and the JSON key for stored submissions. Lowercase, `[a-z0-9_-]+`. |
| Label | Display label rendered above the input. |
| Type | `text`, `email`, `tel`, `url`, `textarea`, `select`, or `checkbox`. |
| Required | Adds `required` to the HTML input + server-side validation. |
| Placeholder | Optional hint shown inside the empty input. |
| Choices (select only) | One per line. Renders an `<option>` per non-empty line. |
| Checkbox label (checkbox only) | Inline text rendered next to the box (e.g. "I agree to the terms"). |

Click **▲** / **▼** to reorder, **×** to remove.

The server validates incoming submissions against the same field list — there's no way for a malicious POST to slip a hidden field in. Type-specific server-side checks:

| Type | Server check |
|---|---|
| `text`, `textarea` | Trimmed, max 5000 chars. |
| `email` | `filter_var(FILTER_VALIDATE_EMAIL)`. |
| `tel` | `^[0-9+\-() ]{4,32}$` regex. |
| `url` | `filter_var(FILTER_VALIDATE_URL)`. |
| `select` | Value must be in the `choices` list. |
| `checkbox` | Coerced to `'1'` if any value present. |

## Wiring the form into your theme

Three options, ordered easiest first.

### Option 1: use the bundled `contact` template

The `blank` theme ships with `templates/contact.twig`. Create a page that uses it:

1. **Pages** → choose any folder (or create one called `pages`) → **+ New page**.
2. Title: `Contact`. Slug: `contact`.
3. **Template** dropdown → **Contact**.
4. Save.

Visit `/contact` (or `/<folder>/contact` if you put it in a folder) on the public site. The form renders. Submit it. You're done.

### Option 2: call the helper directly

In any Twig template:

```twig
{# templates/contact.twig — or anywhere else #}
<h1>Get in touch</h1>
{{ contact_form('contact')|raw }}
```

The helper reads the field list from `site/config.json:forms.contact` and emits one labelled input per field plus the honeypot + submit button. The form posts to `/submit/contact`.

### Option 3: write your own form HTML

The endpoint is just a generic POST handler. If you want custom markup, target it directly:

```html
<form method="post" action="/submit/contact" class="my-form">
  <label>Name <input type="text" name="name" required></label>
  <label>Email <input type="email" name="email" required></label>
  <label>Message <textarea name="message" required></textarea></label>

  {# Honeypot — match the `honeypot_field` setting (default: "website"). #}
  <input type="text" name="website" tabindex="-1" autocomplete="off"
         style="position:absolute;left:-9999px" aria-hidden="true">

  <button type="submit">Send</button>
</form>
```

Field names must match the configured field list in `Settings → Email → Contact form`. The server ignores unknown fields and rejects required-but-empty fields.

## After submission

When someone submits the form:

1. **Honeypot check** — if the honeypot field is non-empty, the request gets a 303 redirect to the success URL silently (so bots don't learn they were caught) and **nothing** is stored or emailed.
2. **Rate-limit check** — if the IP has already exceeded `rate_limit_per_hour` in the last hour, the request gets a `429 Too many requests` response.
3. **Field validation** — required fields must be non-empty, types must match. First validation failure short-circuits to `<success_redirect>?err=<code>:<field>`.
4. **Email send** — built with `From: <from_address>`, `To: <to>`, `Reply-To: <submitter email>` (if the form had an `email` field), subject `<subject_prefix> <submitter name|email|"New submission">`. Body is plain text, one field per labelled paragraph.
5. **Persist** — if `store_submissions` is on, write `site/data/submissions/<form>/<YYYY-MM>/<ts>_<rand>.json` with the full payload + delivery result.
6. **Redirect** — 303 to `success_redirect` (default `/contact?sent=1`).

If the email send fails but storage is on, **the submission is still saved.** Operators can review what came in even when delivery is broken.

## Reviewing submissions

**Settings → Submissions.**

Each row shows when it came in, the form name, a one-line summary, and a delivery badge:

| Badge | Meaning |
|---|---|
| **sent** | Email delivered via SMTP. |
| **mail()** | SMTP failed but PHP `mail()` accepted. Check spam folder. |
| **failed** | Neither SMTP nor `mail()` worked. Submission is on disk; email isn't. |
| **no email** | `Send to` is empty in the form config; no delivery attempted. |

Click a row to open the detail drawer with the full payload, IP, user-agent, and the verbatim SMTP transport result (including any error message).

The **Delete** button removes the submission JSON file from disk. There's no trash bin — these are anonymous public inputs, not editorial content.

## Backups

`site/data/submissions/` is included in **Backup → Full** and **Backup → Content** ZIPs. A restore brings them back. If you delete a submission and run a restore from before the delete, the submission reappears.

## Adding a second form (e.g. newsletter, RSVP)

The endpoint is generic — `/submit/<form>` works for any form name configured under `forms.<name>` in `site/config.json`. The admin UI in v1 only edits `forms.contact`; for additional forms, hand-edit `site/config.json` (or write your own admin UI):

```json
{
  "forms": {
    "contact":    { "to": "you@…", "fields": […], … },
    "newsletter": { "to": "you@…", "subject_prefix": "[Subscribe]",
                    "fields": [{ "name":"email", "type":"email", "required":true }],
                    "rate_limit_per_hour": 10, "success_redirect": "/?subscribed=1",
                    "store_submissions": true }
  }
}
```

Then point a form at `/submit/newsletter` and you're good.

## Troubleshooting

**Test email returns `Connection refused`** — Host or port is wrong, or your VPS/host blocks outbound SMTP. Some shared hosts block port 587 outbound; try port 465 + SSL, or use a different provider.

**Test email returns `535 5.7.8 Username and Password not accepted`** — Credentials are wrong. For Gmail, this almost always means you need an [app password](https://myaccount.google.com/apppasswords) (not your account password).

**Test email returns `STARTTLS failed`** — Provider doesn't support STARTTLS on this port. Switch to SSL on 465.

**Test succeeds via `mail` but you set up SMTP** — SMTP failed and the fallback caught it. The diagnostic shows the SMTP error verbatim. Disable the fallback once you're done debugging so failures are loud.

**Submissions show up but no email** — Check `Settings → Email → Send a test email` first. If the test fails, real submissions also fail — but they still persist to `site/data/submissions/`.

**`429 Too many requests`** — Rate limit hit. Bump `rate_limit_per_hour` in the form config, or clear `site/cache/rate-limit.json` to reset.

**Public form posts but redirect goes to `err=required:email`** — The form's `email` field was empty. Check that your form HTML's `name` attributes match the configured field names exactly.
