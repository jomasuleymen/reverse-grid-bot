import { MigrationInterface, QueryRunner } from "typeorm";

export class Main1731833639428 implements MigrationInterface {
    name = 'Main1731833639428'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_4b8db7e631b6d70e1e5d273336"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "order_id" varchar NOT NULL, "fee_currency" varchar NOT NULL, "custom_id" varchar NOT NULL, "avg_price" real NOT NULL, "quantity" real NOT NULL, "side" text NOT NULL, "fee" real NOT NULL, "symbol" varchar NOT NULL, "created_date" datetime NOT NULL, "bot_id" integer NOT NULL, "trigger_price" real)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot_orders"("id", "order_id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id", "trigger_price") SELECT "id", "order_id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id", "trigger_price" FROM "trading_bot_orders"`);
        await queryRunner.query(`DROP TABLE "trading_bot_orders"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot_orders" RENAME TO "trading_bot_orders"`);
        await queryRunner.query(`CREATE INDEX "IDX_4b8db7e631b6d70e1e5d273336" ON "trading_bot_orders" ("bot_id") `);
        await queryRunner.query(`DROP INDEX "IDX_f570bf2cf6dc75bddf9938961d"`);
        await queryRunner.query(`DROP INDEX "IDX_15af4b63be0b5c589c0badef20"`);
        await queryRunner.query(`DROP INDEX "IDX_e15f04a148cd2c321831651e1a"`);
        await queryRunner.query(`DROP INDEX "IDX_a02101e5415f97dabb9318d7ed"`);
        await queryRunner.query(`DROP INDEX "IDX_df3dbc2491e68eb07e6e6dd88e"`);
        await queryRunner.query(`DROP INDEX "IDX_5f1013eb85d881b2113d9875b4"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" text NOT NULL, "exchange" text NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit_on_grid" integer NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "state" integer NOT NULL DEFAULT (1), "user_id" integer NOT NULL, "credentials_id" integer, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "stopped_at" datetime, "stop_reason" varchar, "position" integer NOT NULL DEFAULT (1), "take_profit" real, "proxy_id" integer, "name" varchar, "trigger_price" real, CONSTRAINT "FK_a02101e5415f97dabb9318d7eda" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_df3dbc2491e68eb07e6e6dd88e6" FOREIGN KEY ("credentials_id") REFERENCES "exchange_credentials" ("id") ON DELETE SET NULL ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot"("id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at", "stop_reason", "position", "take_profit", "proxy_id", "name") SELECT "id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at", "stop_reason", "position", "take_profit", "proxy_id", "name" FROM "trading_bot"`);
        await queryRunner.query(`DROP TABLE "trading_bot"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot" RENAME TO "trading_bot"`);
        await queryRunner.query(`CREATE INDEX "IDX_f570bf2cf6dc75bddf9938961d" ON "trading_bot" ("state") `);
        await queryRunner.query(`CREATE INDEX "IDX_15af4b63be0b5c589c0badef20" ON "trading_bot" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_e15f04a148cd2c321831651e1a" ON "trading_bot" ("exchange") `);
        await queryRunner.query(`CREATE INDEX "IDX_a02101e5415f97dabb9318d7ed" ON "trading_bot" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_df3dbc2491e68eb07e6e6dd88e" ON "trading_bot" ("credentials_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5f1013eb85d881b2113d9875b4" ON "trading_bot" ("proxy_id") `);
        await queryRunner.query(`DROP INDEX "IDX_f570bf2cf6dc75bddf9938961d"`);
        await queryRunner.query(`DROP INDEX "IDX_15af4b63be0b5c589c0badef20"`);
        await queryRunner.query(`DROP INDEX "IDX_e15f04a148cd2c321831651e1a"`);
        await queryRunner.query(`DROP INDEX "IDX_a02101e5415f97dabb9318d7ed"`);
        await queryRunner.query(`DROP INDEX "IDX_df3dbc2491e68eb07e6e6dd88e"`);
        await queryRunner.query(`DROP INDEX "IDX_5f1013eb85d881b2113d9875b4"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" text NOT NULL, "exchange" text NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit_on_grid" integer, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "state" integer NOT NULL DEFAULT (1), "user_id" integer NOT NULL, "credentials_id" integer, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "stopped_at" datetime, "stop_reason" varchar, "position" integer NOT NULL DEFAULT (1), "take_profit" real, "proxy_id" integer, "name" varchar, "trigger_price" real, CONSTRAINT "FK_a02101e5415f97dabb9318d7eda" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_df3dbc2491e68eb07e6e6dd88e6" FOREIGN KEY ("credentials_id") REFERENCES "exchange_credentials" ("id") ON DELETE SET NULL ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot"("id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at", "stop_reason", "position", "take_profit", "proxy_id", "name", "trigger_price") SELECT "id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at", "stop_reason", "position", "take_profit", "proxy_id", "name", "trigger_price" FROM "trading_bot"`);
        await queryRunner.query(`DROP TABLE "trading_bot"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot" RENAME TO "trading_bot"`);
        await queryRunner.query(`CREATE INDEX "IDX_f570bf2cf6dc75bddf9938961d" ON "trading_bot" ("state") `);
        await queryRunner.query(`CREATE INDEX "IDX_15af4b63be0b5c589c0badef20" ON "trading_bot" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_e15f04a148cd2c321831651e1a" ON "trading_bot" ("exchange") `);
        await queryRunner.query(`CREATE INDEX "IDX_a02101e5415f97dabb9318d7ed" ON "trading_bot" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_df3dbc2491e68eb07e6e6dd88e" ON "trading_bot" ("credentials_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5f1013eb85d881b2113d9875b4" ON "trading_bot" ("proxy_id") `);
        await queryRunner.query(`DROP INDEX "IDX_4b8db7e631b6d70e1e5d273336"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "order_id" varchar NOT NULL, "fee_currency" varchar NOT NULL, "custom_id" varchar NOT NULL, "avg_price" real NOT NULL, "quantity" real NOT NULL, "side" text NOT NULL, "fee" real NOT NULL, "symbol" varchar NOT NULL, "created_date" datetime NOT NULL, "bot_id" integer NOT NULL, "trigger_price" real, CONSTRAINT "FK_4b8db7e631b6d70e1e5d2733363" FOREIGN KEY ("bot_id") REFERENCES "trading_bot" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot_orders"("id", "order_id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id", "trigger_price") SELECT "id", "order_id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id", "trigger_price" FROM "trading_bot_orders"`);
        await queryRunner.query(`DROP TABLE "trading_bot_orders"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot_orders" RENAME TO "trading_bot_orders"`);
        await queryRunner.query(`CREATE INDEX "IDX_4b8db7e631b6d70e1e5d273336" ON "trading_bot_orders" ("bot_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_4b8db7e631b6d70e1e5d273336"`);
        await queryRunner.query(`ALTER TABLE "trading_bot_orders" RENAME TO "temporary_trading_bot_orders"`);
        await queryRunner.query(`CREATE TABLE "trading_bot_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "order_id" varchar NOT NULL, "fee_currency" varchar NOT NULL, "custom_id" varchar NOT NULL, "avg_price" real NOT NULL, "quantity" real NOT NULL, "side" text NOT NULL, "fee" real NOT NULL, "symbol" varchar NOT NULL, "created_date" datetime NOT NULL, "bot_id" integer NOT NULL, "trigger_price" real)`);
        await queryRunner.query(`INSERT INTO "trading_bot_orders"("id", "order_id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id", "trigger_price") SELECT "id", "order_id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id", "trigger_price" FROM "temporary_trading_bot_orders"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot_orders"`);
        await queryRunner.query(`CREATE INDEX "IDX_4b8db7e631b6d70e1e5d273336" ON "trading_bot_orders" ("bot_id") `);
        await queryRunner.query(`DROP INDEX "IDX_5f1013eb85d881b2113d9875b4"`);
        await queryRunner.query(`DROP INDEX "IDX_df3dbc2491e68eb07e6e6dd88e"`);
        await queryRunner.query(`DROP INDEX "IDX_a02101e5415f97dabb9318d7ed"`);
        await queryRunner.query(`DROP INDEX "IDX_e15f04a148cd2c321831651e1a"`);
        await queryRunner.query(`DROP INDEX "IDX_15af4b63be0b5c589c0badef20"`);
        await queryRunner.query(`DROP INDEX "IDX_f570bf2cf6dc75bddf9938961d"`);
        await queryRunner.query(`ALTER TABLE "trading_bot" RENAME TO "temporary_trading_bot"`);
        await queryRunner.query(`CREATE TABLE "trading_bot" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" text NOT NULL, "exchange" text NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit_on_grid" integer NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "state" integer NOT NULL DEFAULT (1), "user_id" integer NOT NULL, "credentials_id" integer, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "stopped_at" datetime, "stop_reason" varchar, "position" integer NOT NULL DEFAULT (1), "take_profit" real, "proxy_id" integer, "name" varchar, "trigger_price" real, CONSTRAINT "FK_a02101e5415f97dabb9318d7eda" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_df3dbc2491e68eb07e6e6dd88e6" FOREIGN KEY ("credentials_id") REFERENCES "exchange_credentials" ("id") ON DELETE SET NULL ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "trading_bot"("id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at", "stop_reason", "position", "take_profit", "proxy_id", "name", "trigger_price") SELECT "id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at", "stop_reason", "position", "take_profit", "proxy_id", "name", "trigger_price" FROM "temporary_trading_bot"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot"`);
        await queryRunner.query(`CREATE INDEX "IDX_5f1013eb85d881b2113d9875b4" ON "trading_bot" ("proxy_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_df3dbc2491e68eb07e6e6dd88e" ON "trading_bot" ("credentials_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a02101e5415f97dabb9318d7ed" ON "trading_bot" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e15f04a148cd2c321831651e1a" ON "trading_bot" ("exchange") `);
        await queryRunner.query(`CREATE INDEX "IDX_15af4b63be0b5c589c0badef20" ON "trading_bot" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_f570bf2cf6dc75bddf9938961d" ON "trading_bot" ("state") `);
        await queryRunner.query(`DROP INDEX "IDX_5f1013eb85d881b2113d9875b4"`);
        await queryRunner.query(`DROP INDEX "IDX_df3dbc2491e68eb07e6e6dd88e"`);
        await queryRunner.query(`DROP INDEX "IDX_a02101e5415f97dabb9318d7ed"`);
        await queryRunner.query(`DROP INDEX "IDX_e15f04a148cd2c321831651e1a"`);
        await queryRunner.query(`DROP INDEX "IDX_15af4b63be0b5c589c0badef20"`);
        await queryRunner.query(`DROP INDEX "IDX_f570bf2cf6dc75bddf9938961d"`);
        await queryRunner.query(`ALTER TABLE "trading_bot" RENAME TO "temporary_trading_bot"`);
        await queryRunner.query(`CREATE TABLE "trading_bot" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" text NOT NULL, "exchange" text NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit_on_grid" integer NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "state" integer NOT NULL DEFAULT (1), "user_id" integer NOT NULL, "credentials_id" integer, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "stopped_at" datetime, "stop_reason" varchar, "position" integer NOT NULL DEFAULT (1), "take_profit" real, "proxy_id" integer, "name" varchar, CONSTRAINT "FK_a02101e5415f97dabb9318d7eda" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_df3dbc2491e68eb07e6e6dd88e6" FOREIGN KEY ("credentials_id") REFERENCES "exchange_credentials" ("id") ON DELETE SET NULL ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "trading_bot"("id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at", "stop_reason", "position", "take_profit", "proxy_id", "name") SELECT "id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at", "stop_reason", "position", "take_profit", "proxy_id", "name" FROM "temporary_trading_bot"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot"`);
        await queryRunner.query(`CREATE INDEX "IDX_5f1013eb85d881b2113d9875b4" ON "trading_bot" ("proxy_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_df3dbc2491e68eb07e6e6dd88e" ON "trading_bot" ("credentials_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a02101e5415f97dabb9318d7ed" ON "trading_bot" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e15f04a148cd2c321831651e1a" ON "trading_bot" ("exchange") `);
        await queryRunner.query(`CREATE INDEX "IDX_15af4b63be0b5c589c0badef20" ON "trading_bot" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_f570bf2cf6dc75bddf9938961d" ON "trading_bot" ("state") `);
        await queryRunner.query(`DROP INDEX "IDX_4b8db7e631b6d70e1e5d273336"`);
        await queryRunner.query(`ALTER TABLE "trading_bot_orders" RENAME TO "temporary_trading_bot_orders"`);
        await queryRunner.query(`CREATE TABLE "trading_bot_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "order_id" varchar NOT NULL, "fee_currency" varchar NOT NULL, "custom_id" varchar NOT NULL, "avg_price" real NOT NULL, "quantity" real NOT NULL, "side" text NOT NULL, "fee" real NOT NULL, "symbol" varchar NOT NULL, "created_date" datetime NOT NULL, "bot_id" integer NOT NULL, "trigger_price" real, CONSTRAINT "FK_4b8db7e631b6d70e1e5d2733363" FOREIGN KEY ("bot_id") REFERENCES "temporary_trading_bot" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "trading_bot_orders"("id", "order_id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id", "trigger_price") SELECT "id", "order_id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id", "trigger_price" FROM "temporary_trading_bot_orders"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot_orders"`);
        await queryRunner.query(`CREATE INDEX "IDX_4b8db7e631b6d70e1e5d273336" ON "trading_bot_orders" ("bot_id") `);
    }

}
