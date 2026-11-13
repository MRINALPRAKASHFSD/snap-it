# Support & Troubleshooting Guide

Need help with Snap-it? This document explains where to find answers, report problems, and get technical assistance.

## Getting Help

### 1. Community Discussions
For general questions, implementation guidance, and sharing filter ideas:
- **GitHub Discussions:** [Join our Discussions](https://github.com/MRINALPRAKASHFSD/snap-it/discussions)
- Categories: Q&A, Ideas, Show and Tell, General.

### 2. Bug Reports
If you encounter a reproducible defect in the application:
- Check existing issues first to avoid duplicates.
- Submit a structured report using our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md).

### 3. Security Reports
For security vulnerabilities, please refer to [SECURITY.md](SECURITY.md) and report via private channels. Do not open public issues for security concerns.

## Frequently Encountered Issues

### Camera Permission Denied
- **Symptom:** Viewfinder displays a black screen or shows a permission error banner.
- **Fix:** In your browser settings, grant camera permissions for `localhost:3000` or your deployment domain. Note that browsers require a secure context (`https://` or `localhost`) to access `navigator.mediaDevices`.

### Supabase Connection Errors
- **Symptom:** App fails to load stories or reports auth session failures.
- **Fix:** Verify your `.env` file matches `.env.example` with valid values for `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Ensure your Supabase project is active and that migrations have run.

### Filter Lag or Stuttering
- **Symptom:** Viewfinder drops frames when switching filters.
- **Fix:** Snap-it uses hardware-accelerated CSS filter matrices. Ensure hardware acceleration is enabled in your browser settings (Settings > System > Use graphics acceleration when available).

## Direct Contact

If you have urgent questions or enterprise inquiries:
- **Email:** `mrinalprakash9123@gmail.com`
- **Response SLA:** We aim to reply to general inquiries within 48 business hours.
