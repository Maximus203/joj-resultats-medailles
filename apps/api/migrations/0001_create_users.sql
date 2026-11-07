CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"role" varchar(20) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp (3) with time zone NOT NULL,
	CONSTRAINT "users_role_known" CHECK ("users"."role" in ('journalist', 'supporter'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");