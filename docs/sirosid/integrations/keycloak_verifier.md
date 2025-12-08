# Adding KeyCloak as a Verifier

1. Go to Keycloak Admin Console
2. Select your realm
3. Navigate to Identity Providers → Add provider → OpenID Connect v1.0
4. Configure:
  * Alias: sirosid
  * Display Name: SIROS Credential Manager
  * Discovery Endpoint: https://your.verifier:8080/.well-known/openid-configuration
  * Client ID: keycloak (as registered above)
  * Client Secret: your-secret
  * Client Authentication: Client secret sent as post
  * Validate Signatures: ON
  * Use PKCE: ON
5. Configure Claim mappings
  * Username: sub
  * First Name: given_name
  * Last Name: family_name
  * Email: email
  * Birth Date: birthdate
  * Nationality: nationality
