BEGIN READ ONLY;
SELECT "billingPlan", "isGifted", "impressionLimit",count(*) AS shops,count(*) FILTER (WHERE "cycleImpressions">"impressionLimit") AS over_limit FROM "Billing" WHERE "billingAudience"='legacy' AND "isBillingEnabled" GROUP BY 1,2,3 ORDER BY 1,2,3;
SELECT b.shop,b."billingPlan",b."isGifted",b."cycleImpressions",b."impressionLimit",b."planSelectedAt",b."activeSubscriptionId",b."paidThrough",b."usageFetchedAt",b."cycleStartsAt",b."cycleEndsAt",s.status,s.test FROM "Billing" b LEFT JOIN "BillingSubscription" s ON s."shopId"=b."shopifyShopId" WHERE b."billingAudience"='legacy' AND b."isBillingEnabled" AND b."cycleImpressions">b."impressionLimit" ORDER BY b.shop;
COMMIT;
