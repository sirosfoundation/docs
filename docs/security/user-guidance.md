---
sidebar_position: 4
sidebar_label: User Security Guidance
---

# User Security Guidance

This page provides security guidance for wallet users. Following these
recommendations helps protect your credentials and identity.

## Passkey Security

Your wallet is protected by a passkey (FIDO2 credential) — not a password.
Keep your passkey secure:

- **Register multiple passkeys** on different devices (e.g., phone + security
  key). If you lose one device, you can still access your wallet with
  another.
- **Use hardware security keys** (YubiKey, etc.) for the highest assurance
  level. They are resistant to phishing and device compromise.
- **Enable screen lock** on devices where your passkey is stored. Passkeys
  require user verification (biometric or PIN) — a locked device prevents
  unauthorized use.
- **Never share your passkey** or allow others to register a passkey on
  your wallet account.

:::caution
If you lose all registered passkeys, you will lose access to your wallet
and its credentials. There is no password recovery — register a backup
passkey.
:::

## Phishing Awareness

Passkeys are inherently phishing-resistant — they are bound to your
wallet's domain and cannot be used on a fake site. However, stay vigilant:

- **Always check the URL** in your browser address bar before
  authenticating. Your wallet URL should match exactly what your
  organization provided.
- **Do not enter credentials on sites reached through unsolicited links**
  in emails, messages, or social media.
- **Verify verifier identity** before presenting credentials. The wallet
  shows who is requesting your data and what trust level they have — review
  this information carefully.
- **Be suspicious of urgency**. Legitimate verifiers will not pressure you
  to share credentials immediately.

## Sharing Credentials Safely

When presenting credentials to a verifier:

1. **Review what is requested**. The wallet shows exactly which fields the
   verifier is asking for. Only the fields you approve are shared.
2. **Check the verifier's trust status**. The wallet indicates whether the
   verifier is recognized in a trusted list. Proceed with caution if the
   verifier is unrecognized.
3. **Use selective disclosure**. If the verifier only needs your age
   verification, you do not need to share your full name or address.
4. **Review presentation history**. The wallet keeps a record of what you
   shared and with whom. Check this periodically.

## Browser Security

The SIROS ID wallet runs in your browser. Keep your browser environment
secure:

- **Keep your browser updated**. Browser updates include security patches
  that protect against known vulnerabilities.
- **Use the Wallet Companion extension** if available. It provides
  additional security controls including sandboxed key storage.
- **Avoid public or shared computers** for accessing your wallet. Use
  private/incognito mode if you must, and log out afterward.
- **Review browser extensions**. Malicious extensions can read page content.
  Only install extensions from trusted sources.

## Lost or Stolen Device

If you lose a device with a registered passkey:

1. **Log in from another device** using a backup passkey.
2. **Delete the passkey** associated with the lost device from your wallet
   settings.
3. **Report the loss** to your organization's IT support if the wallet was
   provided by an employer or institution.

If all passkeys are lost, contact your wallet operator for account recovery
procedures.

## Software Updates

- **Ensure your wallet is up to date**. The wallet is a Progressive Web App
  (PWA) that updates automatically when you reload. If prompted to update,
  accept the update.
- **Do not disable the service worker**. It enables offline access and
  automatic updates.

## Incident Reporting

If you suspect your wallet has been compromised, or you notice unexpected
credential presentations:

1. **Log in and review** your presentation history for unauthorized
   activity.
2. **Delete compromised credentials** if you see unauthorized presentations.
3. **Remove suspicious passkeys** from your account.
4. **Contact your wallet operator** immediately to report the incident.
5. **Re-issue credentials** that may have been exposed.

## Data Protection

- **Your credentials are encrypted client-side**. The wallet server stores
  only ciphertext — it cannot read your credentials.
- **Your private keys never leave your browser**. Signing happens locally.
- **Account deletion removes all data**. Deleting your account removes all
  credentials, keys, and personal data from the server. This action is
  irreversible.
