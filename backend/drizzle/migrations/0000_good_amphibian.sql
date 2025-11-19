CREATE TABLE IF NOT EXISTS "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier" varchar(255) NOT NULL,
	"branch" varchar(50) NOT NULL,
	"date" varchar(10) NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"total" varchar(50) NOT NULL,
	"description" text,
	"timestamp" timestamp DEFAULT now(),
	"paid" boolean DEFAULT false,
	"paid_date" varchar(10)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "suppliers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
