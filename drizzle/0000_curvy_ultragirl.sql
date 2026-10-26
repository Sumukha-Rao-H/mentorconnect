CREATE TYPE "public"."meeting_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."note_kind" AS ENUM('note', 'recommendation');--> statement-breakpoint
CREATE TYPE "public"."profile_status" AS ENUM('draft', 'submitted', 'endorsed', 'changes_requested');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('mentee', 'mentor', 'admin', 'hod');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" integer,
	"action" text NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentee_id" integer NOT NULL,
	"created_by_id" integer NOT NULL,
	"title" text NOT NULL,
	"due_date" date,
	"done" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentor_id" integer NOT NULL,
	"mentee_id" integer NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"agenda" text NOT NULL,
	"status" "meeting_status" DEFAULT 'scheduled' NOT NULL,
	"minutes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentee_profiles" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"usn" text,
	"semester" integer,
	"section" text,
	"dob" date,
	"phone" text,
	"address" text,
	"guardian_name" text,
	"guardian_phone" text,
	"cgpa" real,
	"hobbies" text,
	"skills" text,
	"interests" text,
	"achievements" text,
	"career_goal" text,
	"bio" text,
	"photo" text,
	"mentor_id" integer,
	"status" "profile_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone,
	"endorsed_by_id" integer,
	"endorsed_at" timestamp with time zone,
	"admin_remark" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mentee_profiles_usn_unique" UNIQUE("usn")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentee_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"kind" "note_kind" DEFAULT 'note' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"acknowledged" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'mentee' NOT NULL,
	"department" text DEFAULT 'ISE' NOT NULL,
	"phone" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_mentee_id_users_id_fk" FOREIGN KEY ("mentee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_mentor_id_users_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_mentee_id_users_id_fk" FOREIGN KEY ("mentee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentee_profiles" ADD CONSTRAINT "mentee_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentee_profiles" ADD CONSTRAINT "mentee_profiles_mentor_id_users_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentee_profiles" ADD CONSTRAINT "mentee_profiles_endorsed_by_id_users_id_fk" FOREIGN KEY ("endorsed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_mentee_id_users_id_fk" FOREIGN KEY ("mentee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goals_mentee_idx" ON "goals" USING btree ("mentee_id");--> statement-breakpoint
CREATE INDEX "meetings_mentor_idx" ON "meetings" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "meetings_mentee_idx" ON "meetings" USING btree ("mentee_id");--> statement-breakpoint
CREATE INDEX "mentee_profiles_mentor_idx" ON "mentee_profiles" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "notes_mentee_idx" ON "notes" USING btree ("mentee_id");