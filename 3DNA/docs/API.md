# 3DNA Bus Tracking System - API Documentation

## Quick Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `auth.php?action=login` | POST | No | User login |
| `auth.php?action=register` | POST | No | User registration |
| `buses.php?action=list` | GET | No | List all buses |
| `buses.php?action=get` | GET | No | Get single bus |
| `buses.php?action=create` | POST | Yes | Create bus |
| `buses.php?action=stats` | GET | No | Bus statistics |
| `routes.php?action=list` | GET | No | List all routes |
| `routes.php?action=stops` | GET | No | Get route stops |
| `routes.php?action=create` | POST | Yes | Create route |
| `locations.php?action=update` | POST | Yes | Update GPS location |
| `locations.php?action=current` | GET | No | Get current location |
| `drivers.php?action=assigned_bus` | GET | Yes | Get driver's assigned bus |
| `trips.php?action=start` | POST | Yes | Start a trip |
| `trips.php?action=end` | POST | Yes | End a trip |
| `users.php?action=list` | GET | Yes | List users |
| `users.php?action=create` | POST | Yes | Create user |
| `analytics.php?action=overview` | GET | No | Fleet analytics |

## Authentication

All protected endpoints require:
```
Authorization: Bearer {token}
Content-Type: application/json
```

Tokens are returned upon successful login.

## Response Format

All endpoints return JSON:
```json
{
    "success": true/false,
    "message": "Description",
    "data": { ... }
}
```

## Error Handling

- **401 Unauthorized** - Invalid token
- **400 Bad Request** - Missing required parameters
- **404 Not Found** - Resource not found
- **500 Server Error** - Database or server error

## Rate Limiting

Current: No rate limiting (recommended for production)

## Pagination

Not currently implemented. Future versions will include:
- `?limit=50&offset=0`

## Filtering

Supported filters:
- Routes: `?active=1`
- Buses: `?status=active`
- Users: `?type=driver`
