CREATE TABLE "podiums" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_name" varchar(100) NOT NULL,
	"event_key" varchar(100) NOT NULL,
	"discipline" varchar(100) NOT NULL,
	"day" date NOT NULL,
	"gold" varchar(3) NOT NULL,
	"silver" varchar(3) NOT NULL,
	"bronze" varchar(3) NOT NULL,
	"created_at" timestamp (3) with time zone NOT NULL,
	CONSTRAINT "podiums_countries_distinct" CHECK ("podiums"."gold" <> "podiums"."silver" and "podiums"."gold" <> "podiums"."bronze" and "podiums"."silver" <> "podiums"."bronze")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "podiums_event_key_key" ON "podiums" USING btree ("event_key");