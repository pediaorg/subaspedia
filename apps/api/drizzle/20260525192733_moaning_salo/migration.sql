CREATE TABLE `attendees` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`bidder_number` integer NOT NULL,
	`client_id` integer NOT NULL,
	`auction_id` integer NOT NULL,
	CONSTRAINT `fk_attendees_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`),
	CONSTRAINT `fk_attendees_auction_id_auctions_id_fk` FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`)
);
--> statement-breakpoint
CREATE TABLE `auction_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`auction_id` integer NOT NULL,
	`owner_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`client_id` integer NOT NULL,
	`amount` real NOT NULL,
	`commission` real NOT NULL,
	CONSTRAINT `fk_auction_records_auction_id_auctions_id_fk` FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`),
	CONSTRAINT `fk_auction_records_owner_id_owners_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`),
	CONSTRAINT `fk_auction_records_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
	CONSTRAINT `fk_auction_records_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`),
	CONSTRAINT "chk_record_amount" CHECK("amount" > 0.01),
	CONSTRAINT "chk_record_commission" CHECK("commission" > 0.01)
);
--> statement-breakpoint
CREATE TABLE `auctioneers` (
	`id` integer PRIMARY KEY,
	`license` text,
	`region` text,
	CONSTRAINT `fk_auctioneers_id_people_id_fk` FOREIGN KEY (`id`) REFERENCES `people`(`id`)
);
--> statement-breakpoint
CREATE TABLE `auctions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`date` text,
	`time` text NOT NULL,
	`status` text,
	`auctioneer_id` integer,
	`location` text,
	`attendee_capacity` integer,
	`has_warehouse` integer,
	`own_security` integer,
	`category` text,
	CONSTRAINT `fk_auctions_auctioneer_id_auctioneers_id_fk` FOREIGN KEY (`auctioneer_id`) REFERENCES `auctioneers`(`id`),
	CONSTRAINT "chk_date" CHECK("date" > date('now', '+10 days')),
	CONSTRAINT "chk_auction_status" CHECK("status" IN ('open', 'closed')),
	CONSTRAINT "chk_auction_category" CHECK("category" IN ('common', 'special', 'silver', 'gold', 'platinum'))
);
--> statement-breakpoint
CREATE TABLE `bids` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`attendee_id` integer NOT NULL,
	`item_id` integer NOT NULL,
	`amount` real NOT NULL,
	`winner` integer DEFAULT false,
	CONSTRAINT `fk_bids_attendee_id_attendees_id_fk` FOREIGN KEY (`attendee_id`) REFERENCES `attendees`(`id`),
	CONSTRAINT `fk_bids_item_id_catalog_items_id_fk` FOREIGN KEY (`item_id`) REFERENCES `catalog_items`(`id`),
	CONSTRAINT "chk_bid_amount" CHECK("amount" > 0.01)
);
--> statement-breakpoint
CREATE TABLE `catalog_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`catalog_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`base_price` real NOT NULL,
	`commission` real NOT NULL,
	`state` text,
	CONSTRAINT `fk_catalog_items_catalog_id_catalogs_id_fk` FOREIGN KEY (`catalog_id`) REFERENCES `catalogs`(`id`),
	CONSTRAINT `fk_catalog_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
	CONSTRAINT "chk_base_price" CHECK("base_price" > 0.01),
	CONSTRAINT "chk_commission" CHECK("commission" > 0.01)
);
--> statement-breakpoint
CREATE TABLE `catalogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`description` text NOT NULL,
	`auction_id` integer,
	`manager_id` integer NOT NULL,
	CONSTRAINT `fk_catalogs_auction_id_auctions_id_fk` FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`),
	CONSTRAINT `fk_catalogs_manager_id_employees_id_fk` FOREIGN KEY (`manager_id`) REFERENCES `employees`(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` integer PRIMARY KEY,
	`country_id` integer,
	`admitted` integer,
	`category` text,
	`verifier_id` integer NOT NULL,
	CONSTRAINT `fk_clients_id_people_id_fk` FOREIGN KEY (`id`) REFERENCES `people`(`id`),
	CONSTRAINT `fk_clients_country_id_countries_id_fk` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`),
	CONSTRAINT `fk_clients_verifier_id_employees_id_fk` FOREIGN KEY (`verifier_id`) REFERENCES `employees`(`id`),
	CONSTRAINT "chk_category" CHECK("category" IN ('common', 'special', 'silver', 'gold', 'platinum'))
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`id` integer PRIMARY KEY,
	`name` text NOT NULL,
	`short_name` text,
	`capital` text NOT NULL,
	`nationality` text NOT NULL,
	`languages` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` integer PRIMARY KEY,
	`position` text,
	`sector_id` integer,
	CONSTRAINT `fk_employees_id_people_id_fk` FOREIGN KEY (`id`) REFERENCES `people`(`id`)
);
--> statement-breakpoint
CREATE TABLE `insurances` (
	`policy_number` text PRIMARY KEY,
	`company` text NOT NULL,
	`combined_policy` integer,
	`amount` real NOT NULL,
	CONSTRAINT "chk_amount" CHECK("amount" > 0)
);
--> statement-breakpoint
CREATE TABLE `owners` (
	`id` integer PRIMARY KEY,
	`country_id` integer,
	`financial_verification` integer,
	`judicial_verification` integer,
	`risk_rating` integer,
	`verifier_id` integer NOT NULL,
	CONSTRAINT `fk_owners_id_people_id_fk` FOREIGN KEY (`id`) REFERENCES `people`(`id`),
	CONSTRAINT `fk_owners_country_id_countries_id_fk` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`),
	CONSTRAINT `fk_owners_verifier_id_employees_id_fk` FOREIGN KEY (`verifier_id`) REFERENCES `employees`(`id`),
	CONSTRAINT "chk_risk_rating" CHECK("risk_rating" IN (1, 2, 3, 4, 5, 6))
);
--> statement-breakpoint
CREATE TABLE `people` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`document` text NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`status` text,
	`photo` blob,
	CONSTRAINT "chk_status" CHECK("status" IN ('active', 'inactive'))
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`product_id` integer NOT NULL,
	`photo` blob NOT NULL,
	CONSTRAINT `fk_photos_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`date` text,
	`available` integer,
	`catalog_description` text DEFAULT 'None',
	`full_description` text NOT NULL,
	`reviewer_id` integer,
	`owner_id` integer,
	`insurance_policy` text,
	`name` text NOT NULL,
	CONSTRAINT `fk_products_reviewer_id_employees_id_fk` FOREIGN KEY (`reviewer_id`) REFERENCES `employees`(`id`),
	CONSTRAINT `fk_products_owner_id_owners_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`),
	CONSTRAINT `fk_products_insurance_policy_insurances_policy_number_fk` FOREIGN KEY (`insurance_policy`) REFERENCES `insurances`(`policy_number`)
);
--> statement-breakpoint
CREATE TABLE `sectors` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`sector_name` text NOT NULL,
	`sector_code` text,
	`sector_manager_id` integer,
	CONSTRAINT `fk_sectors_sector_manager_id_employees_id_fk` FOREIGN KEY (`sector_manager_id`) REFERENCES `employees`(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`email` text NOT NULL UNIQUE,
	`password_hash` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
