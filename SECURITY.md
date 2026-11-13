# Security Policy

We treat security as a baseline engineering discipline. If you find a security vulnerability in Snap-it, please tell us right away so we can fix it before it affects users.

## Supported Versions

We provide security patches for the following versions:

| Version | Supported          | Security Notes |
| ------- | ------------------ | -------------- |
| 1.0.x   | :white_check_mark: | Current active release branch |
| < 1.0   | :x:                | Pre-release alpha/beta builds, unsupported |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security bugs.**

Instead, report vulnerabilities through one of these channels:

1. **GitHub Private Security Advisory:** Open an advisory under our repository's [Security Tab](https://github.com/MRINALPRAKASHFSD/snap-it/security/advisories/new).
2. **Direct Security Contact:** Email `security@snapit.internal` or `mrinalprakash9123@gmail.com` with the subject prefix `[SECURITY VULNERABILITY]`.

### What to Include in Your Report

To help us triage and patch the issue quickly, include:
- A description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or a minimal proof of concept (PoC).
- The affected component (e.g., Supabase RLS policy, camera pipeline, authentication middleware, signed URL generator).
- Any proposed fix or mitigation if you have one.

## Response Timeline & SLAs

We follow these target response times:

- **Initial Acknowledgment:** Within 24 hours of receipt.
- **Triage & Severity Assessment:** Within 72 hours.
- **Status Updates:** Every 48 hours while a fix is being tested.
- **Fix Deployment & Public Advisory:** Target release within 14 calendar days depending on severity.

## Core Security Guarantees in Snap-it

Snap-it enforces five architectural rules at the database and storage layers:

1. **Zero Location Tracking:** We do not request, store, or infer GPS coordinates or IP geolocations. Discovery uses interest tags only.
2. **Owner-Scoped Media Buckets:** User media is stored in the private `gallery` bucket under `<uid>/`. Direct public access is blocked.
3. **Short-Lived Signed URLs:** Media access requires short-lived signed URLs (maximum 60-second validity) generated only after database-verified relationship checks.
4. **Database-Level Blocking:** Blocking is enforced directly by Postgres foreign keys, unique pair guards, and RLS policies. It immediately disconnects friendships and cuts off messaging, discovery, and media views.
5. **Strict Ephemerality:** Stories expire automatically after 24 hours via database timestamps. Clients cannot forge expiry dates or claim unearned engagement points.

## Safe Harbor

We consider security research conducted in good faith to be authorized. We will not take legal action against researchers who:
- Make a reasonable effort to avoid privacy violations, data destruction, and service interruption.
- Give us reasonable time to fix the issue before public disclosure.
- Do not exploit the vulnerability beyond what is strictly necessary to confirm its existence.
