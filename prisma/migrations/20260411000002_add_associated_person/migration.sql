-- ISSUER tenant — distinguish associated persons of the issuer (officers,
-- directors, employees, significant shareholders) from external compensated
-- promoters. Associated persons are exempt from broker-dealer registration
-- analysis when promoting their own issuer's offering.
ALTER TABLE "ambassador_profiles"
ADD COLUMN "isAssociatedPerson" BOOLEAN NOT NULL DEFAULT false;
