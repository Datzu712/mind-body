CREATE SCHEMA "core";
--> statement-breakpoint
CREATE TABLE "core"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"keycloak_id" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_keycloak_id_unique" UNIQUE("keycloak_id")
);
