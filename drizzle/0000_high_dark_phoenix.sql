CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar,
	"email" varchar,
	"password" varchar,
	"userName" varchar,
	"phone" varchar,
	"tokens" varchar,
	"signMethod" varchar,
	CONSTRAINT "users_userId_unique" UNIQUE("userId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
