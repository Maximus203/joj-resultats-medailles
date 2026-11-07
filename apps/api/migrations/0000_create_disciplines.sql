CREATE TABLE "disciplines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"created_at" timestamp (3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "disciplines_name_key" ON "disciplines" USING btree ("name");