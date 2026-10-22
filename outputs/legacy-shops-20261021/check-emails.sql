BEGIN READ ONLY;
SELECT count(*) AS missing_linked_email,
count(*) FILTER (WHERE EXISTS (SELECT 1 FROM "Session" s WHERE s.shop=b.shop AND NULLIF(s.email,'') IS NOT NULL)) AS with_other_session_email
FROM "Billing" b LEFT JOIN "Session" sess ON sess.id=b."sessionId"
WHERE b."billingAudience"='legacy' AND b."isBillingEnabled" AND b."billingPlan"='free' AND b."cycleImpressions">b."impressionLimit" AND NULLIF(sess.email,'') IS NULL;
COMMIT;
