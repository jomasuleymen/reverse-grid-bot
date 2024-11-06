import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1730907198271 implements MigrationInterface {
    name = 'Init1730907198271'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_4b8db7e631b6d70e1e5d273336"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fee_currency" varchar NOT NULL, "custom_id" varchar NOT NULL, "avg_price" real NOT NULL, "quantity" real NOT NULL, "side" varchar CHECK( "side" IN ('buy','sell') ) NOT NULL, "fee" real NOT NULL, "symbol" varchar NOT NULL, "created_date" datetime NOT NULL, "bot_id" integer NOT NULL, "order_id" varchar NOT NULL, CONSTRAINT "FK_4b8db7e631b6d70e1e5d2733363" FOREIGN KEY ("bot_id") REFERENCES "trading_bot" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot_orders"("id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id", "order_id") SELECT "id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id", "order_id" FROM "trading_bot_orders"`);
        await queryRunner.query(`DROP TABLE "trading_bot_orders"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot_orders" RENAME TO "trading_bot_orders"`);
        await queryRunner.query(`CREATE INDEX "IDX_4b8db7e631b6d70e1e5d273336" ON "trading_bot_orders" ("bot_id") `);
        await queryRunner.query(`DROP INDEX "IDX_df3dbc2491e68eb07e6e6dd88e"`);
        await queryRunner.query(`DROP INDEX "IDX_a02101e5415f97dabb9318d7ed"`);
        await queryRunner.query(`DROP INDEX "IDX_e15f04a148cd2c321831651e1a"`);
        await queryRunner.query(`DROP INDEX "IDX_15af4b63be0b5c589c0badef20"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" text NOT NULL, "exchange" text NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit_on_grid" real NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "state" integer NOT NULL DEFAULT (1), "user_id" integer NOT NULL, "credentials_id" integer, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "stopped_at" datetime, CONSTRAINT "FK_df3dbc2491e68eb07e6e6dd88e6" FOREIGN KEY ("credentials_id") REFERENCES "exchange_credentials" ("id") ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT "FK_a02101e5415f97dabb9318d7eda" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot"("id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at") SELECT "id", "type", "exchange", "base_currency", "quote_currency", "take_profit", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at" FROM "trading_bot"`);
        await queryRunner.query(`DROP TABLE "trading_bot"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot" RENAME TO "trading_bot"`);
        await queryRunner.query(`CREATE INDEX "IDX_df3dbc2491e68eb07e6e6dd88e" ON "trading_bot" ("credentials_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a02101e5415f97dabb9318d7ed" ON "trading_bot" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e15f04a148cd2c321831651e1a" ON "trading_bot" ("exchange") `);
        await queryRunner.query(`CREATE INDEX "IDX_15af4b63be0b5c589c0badef20" ON "trading_bot" ("type") `);
        await queryRunner.query(`DROP INDEX "IDX_1ea32e1069f3231dc7e686714d"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit_on_grid" real NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "FK_1ea32e1069f3231dc7e686714d2" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot_config"("id", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "user_id") SELECT "id", "base_currency", "quote_currency", "take_profit", "grid_step", "grid_volume", "user_id" FROM "trading_bot_config"`);
        await queryRunner.query(`DROP TABLE "trading_bot_config"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot_config" RENAME TO "trading_bot_config"`);
        await queryRunner.query(`CREATE INDEX "IDX_1ea32e1069f3231dc7e686714d" ON "trading_bot_config" ("user_id") `);
        await queryRunner.query(`DROP INDEX "IDX_4b8db7e631b6d70e1e5d273336"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fee_currency" varchar NOT NULL, "custom_id" varchar NOT NULL, "avg_price" real NOT NULL, "quantity" real NOT NULL, "side" varchar CHECK( "side" IN ('buy','sell') ) NOT NULL, "fee" real NOT NULL, "symbol" varchar NOT NULL, "created_date" datetime NOT NULL, "bot_id" integer NOT NULL, "order_id" varchar NOT NULL, CONSTRAINT "FK_4b8db7e631b6d70e1e5d2733363" FOREIGN KEY ("bot_id") REFERENCES "trading_bot" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot_orders"("id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id", "order_id") SELECT "id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id", "order_id" FROM "trading_bot_orders"`);
        await queryRunner.query(`DROP TABLE "trading_bot_orders"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot_orders" RENAME TO "trading_bot_orders"`);
        await queryRunner.query(`CREATE INDEX "IDX_4b8db7e631b6d70e1e5d273336" ON "trading_bot_orders" ("bot_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_4b8db7e631b6d70e1e5d273336"`);
        await queryRunner.query(`ALTER TABLE "trading_bot_orders" RENAME TO "temporary_trading_bot_orders"`);
        await queryRunner.query(`CREATE TABLE "trading_bot_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fee_currency" varchar NOT NULL, "custom_id" varchar NOT NULL, "avg_price" real NOT NULL, "quantity" real NOT NULL, "side" varchar CHECK( "side" IN ('buy','sell') ) NOT NULL, "fee" real NOT NULL, "symbol" varchar NOT NULL, "created_date" datetime NOT NULL, "bot_id" integer NOT NULL, "order_id" varchar NOT NULL, CONSTRAINT "FK_4b8db7e631b6d70e1e5d2733363" FOREIGN KEY ("bot_id") REFERENCES "trading_bot" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "trading_bot_orders"("id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id", "order_id") SELECT "id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id", "order_id" FROM "temporary_trading_bot_orders"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot_orders"`);
        await queryRunner.query(`CREATE INDEX "IDX_4b8db7e631b6d70e1e5d273336" ON "trading_bot_orders" ("bot_id") `);
        await queryRunner.query(`DROP INDEX "IDX_1ea32e1069f3231dc7e686714d"`);
        await queryRunner.query(`ALTER TABLE "trading_bot_config" RENAME TO "temporary_trading_bot_config"`);
        await queryRunner.query(`CREATE TABLE "trading_bot_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit" real NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "FK_1ea32e1069f3231dc7e686714d2" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "trading_bot_config"("id", "base_currency", "quote_currency", "take_profit", "grid_step", "grid_volume", "user_id") SELECT "id", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "user_id" FROM "temporary_trading_bot_config"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot_config"`);
        await queryRunner.query(`CREATE INDEX "IDX_1ea32e1069f3231dc7e686714d" ON "trading_bot_config" ("user_id") `);
        await queryRunner.query(`DROP INDEX "IDX_15af4b63be0b5c589c0badef20"`);
        await queryRunner.query(`DROP INDEX "IDX_e15f04a148cd2c321831651e1a"`);
        await queryRunner.query(`DROP INDEX "IDX_a02101e5415f97dabb9318d7ed"`);
        await queryRunner.query(`DROP INDEX "IDX_df3dbc2491e68eb07e6e6dd88e"`);
        await queryRunner.query(`ALTER TABLE "trading_bot" RENAME TO "temporary_trading_bot"`);
        await queryRunner.query(`CREATE TABLE "trading_bot" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" text NOT NULL, "exchange" text NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit" real NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "state" integer NOT NULL DEFAULT (1), "user_id" integer NOT NULL, "credentials_id" integer, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "stopped_at" datetime, CONSTRAINT "FK_df3dbc2491e68eb07e6e6dd88e6" FOREIGN KEY ("credentials_id") REFERENCES "exchange_credentials" ("id") ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT "FK_a02101e5415f97dabb9318d7eda" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "trading_bot"("id", "type", "exchange", "base_currency", "quote_currency", "take_profit", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at") SELECT "id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at" FROM "temporary_trading_bot"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot"`);
        await queryRunner.query(`CREATE INDEX "IDX_15af4b63be0b5c589c0badef20" ON "trading_bot" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_e15f04a148cd2c321831651e1a" ON "trading_bot" ("exchange") `);
        await queryRunner.query(`CREATE INDEX "IDX_a02101e5415f97dabb9318d7ed" ON "trading_bot" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_df3dbc2491e68eb07e6e6dd88e" ON "trading_bot" ("credentials_id") `);
        await queryRunner.query(`DROP INDEX "IDX_4b8db7e631b6d70e1e5d273336"`);
        await queryRunner.query(`ALTER TABLE "trading_bot_orders" RENAME TO "temporary_trading_bot_orders"`);
        await queryRunner.query(`CREATE TABLE "trading_bot_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fee_currency" varchar NOT NULL, "custom_id" varchar NOT NULL, "avg_price" real NOT NULL, "quantity" real NOT NULL, "side" varchar CHECK( "side" IN ('buy','sell') ) NOT NULL, "fee" real NOT NULL, "symbol" varchar NOT NULL, "created_date" datetime NOT NULL, "bot_id" integer NOT NULL, "order_id" varchar NOT NULL, CONSTRAINT "FK_4b8db7e631b6d70e1e5d2733363" FOREIGN KEY ("bot_id") REFERENCES "trading_bot" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "trading_bot_orders"("id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id", "order_id") SELECT "id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id", "order_id" FROM "temporary_trading_bot_orders"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot_orders"`);
        await queryRunner.query(`CREATE INDEX "IDX_4b8db7e631b6d70e1e5d273336" ON "trading_bot_orders" ("bot_id") `);
    }

}
