BEGIN READ ONLY;
COPY (
  SELECT DISTINCT b.shop AS "Shop name", sess.email AS "Email"
  FROM "Billing" b
  LEFT JOIN "Session" sess ON sess.id = b."sessionId"
  WHERE b."billingAudience" = 'legacy'
    AND b."isBillingEnabled" = true
    AND b."billingPlan" = 'free'
    AND b."cycleImpressions" > b."impressionLimit"
    AND b."activeSubscriptionId" IS NULL
    AND b."paidThrough" IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM "BillingSubscription" s
      WHERE s."shopId" = b."shopifyShopId"
        AND s."amountCents" > 0
        AND s.test = false
        AND s.status IN ('ACTIVE', 'CANCELLED', 'EXPIRED')
    )
  ORDER BY 1
) TO '/tmp/legacy-shops-emails-20261021.csv' WITH (FORMAT CSV, HEADER true);
COMMIT;
