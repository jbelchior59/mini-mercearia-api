# Security

## Implemented Protections

- bcrypt hashes passwords before storage.
- JWT access tokens use a required production secret, issuer, audience and short expiry.
- RBAC protects admin/staff/customer routes.
- Rate limiting is applied to login and registration.
- CORS uses an allowlist from `CLIENT_ORIGIN`.
- Helmet sets baseline security headers.
- express-validator validates request bodies and local resource IDs.
- Frontend output escapes API/localStorage data before using `innerHTML`.
- Mass assignment is reduced with allowlists on product and coupon updates.
- File uploads allow only JPEG, PNG and WebP, limit files to 2MB and generate random filenames.
- Atomic stock decrements prevent negative stock under concurrent orders.
- Atomic coupon usage increments prevent exceeding `maxUses`.
- Security events are logged as JSON without passwords or tokens.
- Global error handling avoids stack trace disclosure in production.

## Known Limitations

- Refresh tokens are not implemented yet.
- Uploaded images are validated by type/extension but not scanned by antivirus or content inspection.
- Security tests can be expanded; current validation is build/manual oriented.
- Order rollback can be expanded with broader Prisma transactions for stronger all-or-nothing guarantees.
