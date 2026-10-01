-- The replayer verifies the endpoint's current key identity without wrapped/private key access.
GRANT SELECT(secret_version)ON webhook_endpoints TO mailcraft_webhook_replayer;
