CREATE TABLE IF NOT EXISTS "charts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"song_id" varchar(64) NOT NULL,
	"level" varchar(16) NOT NULL,
	"rating" integer NOT NULL,
	"notes" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chart_id" varchar(64) NOT NULL,
	"song_id" varchar(64) NOT NULL,
	"player_name" varchar(64) DEFAULT 'Anonyme' NOT NULL,
	"score" integer NOT NULL,
	"max_combo" integer NOT NULL,
	"accuracy" real NOT NULL,
	"rank" varchar(4) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "songs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"artist" varchar(255) NOT NULL,
	"bpm" integer NOT NULL,
	"duration" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "charts" ADD CONSTRAINT "charts_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scores" ADD CONSTRAINT "scores_chart_id_charts_id_fk" FOREIGN KEY ("chart_id") REFERENCES "public"."charts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scores" ADD CONSTRAINT "scores_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
