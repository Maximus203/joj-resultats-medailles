CREATE TABLE "podium_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"podium_id" uuid NOT NULL,
	"gold" varchar(3) NOT NULL,
	"silver" varchar(3) NOT NULL,
	"bronze" varchar(3) NOT NULL,
	"corrected_at" timestamp (3) with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "podium_revisions" ADD CONSTRAINT "podium_revisions_podium_id_podiums_id_fk" FOREIGN KEY ("podium_id") REFERENCES "public"."podiums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "podium_revisions_podium_id_idx" ON "podium_revisions" USING btree ("podium_id");