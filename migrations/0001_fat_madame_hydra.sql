CREATE TABLE "privacy_policy" (
	"id" varchar PRIMARY KEY DEFAULT 'privacy_policy' NOT NULL,
	"content" text NOT NULL,
	"last_updated_by" varchar,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "privacy_sections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_key" varchar NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"icon" text,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"last_updated_by" varchar,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "privacy_sections_section_key_unique" UNIQUE("section_key")
);
--> statement-breakpoint
CREATE TABLE "promotion_settings" (
	"id" varchar PRIMARY KEY DEFAULT 'promotion_settings' NOT NULL,
	"featured_store_enabled" boolean DEFAULT true,
	"sponsored_product_enabled" boolean DEFAULT true,
	"boosted_post_enabled" boolean DEFAULT true,
	"story_ads_enabled" boolean DEFAULT true,
	"location_ads_enabled" boolean DEFAULT true,
	"premium_subscription_enabled" boolean DEFAULT true,
	"featured_store_daily_price" numeric DEFAULT '500',
	"featured_store_weekly_price" numeric DEFAULT '3000',
	"featured_store_monthly_price" numeric DEFAULT '10000',
	"sponsored_product_daily_price" numeric DEFAULT '500',
	"sponsored_product_weekly_price" numeric DEFAULT '2000',
	"sponsored_product_monthly_price" numeric DEFAULT '5000',
	"boosted_post_price" numeric DEFAULT '300',
	"boosted_post_weekly_price" numeric DEFAULT '1000',
	"story_ad_daily_price" numeric DEFAULT '500',
	"story_ad_weekly_price" numeric DEFAULT '3000',
	"location_ad_daily_price" numeric DEFAULT '200',
	"location_ad_weekly_price" numeric DEFAULT '1500',
	"premium_bronze_monthly_price" numeric DEFAULT '5000',
	"premium_silver_monthly_price" numeric DEFAULT '10000',
	"premium_gold_monthly_price" numeric DEFAULT '20000',
	"max_promotions_per_vendor" integer DEFAULT 10,
	"max_active_promotions_per_vendor" integer DEFAULT 5,
	"max_featured_stores_on_homepage" integer DEFAULT 5,
	"max_sponsored_products_on_homepage" integer DEFAULT 10,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"promotion_type" text NOT NULL,
	"target_id" varchar,
	"target_type" text,
	"duration" text NOT NULL,
	"duration_days" integer NOT NULL,
	"price" numeric NOT NULL,
	"paid_amount" numeric DEFAULT '0',
	"target_locations" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"payment_method" text DEFAULT 'cash',
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejection_reason" text,
	"admin_notes" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"view_count" integer DEFAULT 0,
	"click_count" integer DEFAULT 0,
	"conversion_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_chat_id_chats_id_fk";
--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;