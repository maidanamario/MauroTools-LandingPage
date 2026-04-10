# Project Guidelines

## Code Style
Frontend development standards in [.cursorrules](.cursorrules): semantic HTML, separate CSS/JS, mobile-first responsive design, reusable components.

## Architecture
Static HTML/CSS/JS e-commerce site with two pages: landing page ([docs/index.html](docs/index.html)) and admin panel ([docs/admin.html](docs/admin.html)). Uses localStorage for data persistence. WhatsApp integration for orders.

## Build and Test
No build system. Open [docs/index.html](docs/index.html) in browser for testing. Python virtual environment unused.

## Conventions
- Phone validation: 8–15 digits only
- WhatsApp messages URL-encoded
- Admin password in [js/admin.js](docs/js/admin.js)
- Never rewrite entire files; modify only necessary parts