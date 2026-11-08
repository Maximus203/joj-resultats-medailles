CREATE TABLE "scrape_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"trigger" varchar(10) NOT NULL,
	"status" varchar(10) NOT NULL,
	"started_at" timestamp (3) with time zone NOT NULL,
	"finished_at" timestamp (3) with time zone NOT NULL,
	"imported" integer NOT NULL,
	"updated" integer NOT NULL,
	"identical" integer NOT NULL,
	"kept" integer NOT NULL,
	"absent" integer NOT NULL,
	"ignored" integer NOT NULL,
	"errors" integer NOT NULL,
	"report" jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "scrape_runs_started_at_idx" ON "scrape_runs" USING btree ("started_at");