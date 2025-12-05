#!/bin/sh
set -e
npm ci
npm run openapi-lint
npm run redocly-lint
npm run bundle
npm run localize-redoc
