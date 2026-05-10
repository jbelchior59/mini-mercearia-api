# Threat Model

## Assets

- User accounts
- JWT tokens
- Admin panel
- Products
- Orders
- Coupons
- Uploads

## Threats and Mitigations

| Threat | Mitigation |
| --- | --- |
| Brute force login | Login rate limiting and generic credential errors |
| XSS | Escaping API/localStorage data in frontend rendering |
| Broken access control | JWT auth middleware and RBAC roles on sensitive routes |
| Mass assignment | Field allowlists on product and coupon updates |
| Insecure file upload | MIME and extension allowlists, 2MB limit and random filenames |
| Race condition in stock | Atomic stock decrement with `stock >= qty` |
| Coupon abuse | Active/date/minimum checks and atomic `usedCount` increment |
| Invalid ID probing | Reusable local ID validation returning 400 |
| Sensitive data leakage in logs | Security logs omit passwords and tokens |
| Error information disclosure | Global error handler returns generic production errors |
