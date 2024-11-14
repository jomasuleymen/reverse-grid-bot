import { MigrationInterface, QueryRunner } from "typeorm";

export class Main1731564755964 implements MigrationInterface {
    name = 'Main1731564755964'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_df3dbc2491e68eb07e6e6dd88e"`);
        await queryRunner.query(`DROP INDEX "IDX_a02101e5415f97dabb9318d7ed"`);
        await queryRunner.query(`DROP INDEX "IDX_e15f04a148cd2c321831651e1a"`);
        await queryRunner.query(`DROP INDEX "IDX_15af4b63be0b5c589c0badef20"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" text NOT NULL, "exchange" text NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit_on_grid" real NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "state" integer NOT NULL DEFAULT (1), "user_id" integer NOT NULL, "credentials_id" integer, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "stopped_at" datetime, "stop_reason" varchar, "position" integer NOT NULL DEFAULT (1), "take_profit" real, CONSTRAINT "FK_df3dbc2491e68eb07e6e6dd88e6" FOREIGN KEY ("credentials_id") REFERENCES "exchange_credentials" ("id") ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT "FK_a02101e5415f97dabb9318d7eda" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot"("id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at", "stop_reason", "position") SELECT "id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at", "stop_reason", "position" FROM "trading_bot"`);
        await queryRunner.query(`DROP TABLE "trading_bot"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot" RENAME TO "trading_bot"`);
        await queryRunner.query(`CREATE INDEX "IDX_df3dbc2491e68eb07e6e6dd88e" ON "trading_bot" ("credentials_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a02101e5415f97dabb9318d7ed" ON "trading_bot" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e15f04a148cd2c321831651e1a" ON "trading_bot" ("exchange") `);
        await queryRunner.query(`CREATE INDEX "IDX_15af4b63be0b5c589c0badef20" ON "trading_bot" ("type") `);
        await queryRunner.query(`DROP INDEX "IDX_1ea32e1069f3231dc7e686714d"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit_on_grid" real NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "user_id" integer NOT NULL, "take_profit" real, CONSTRAINT "FK_1ea32e1069f3231dc7e686714d2" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot_config"("id", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "user_id") SELECT "id", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "user_id" FROM "trading_bot_config"`);
        await queryRunner.query(`DROP TABLE "trading_bot_config"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot_config" RENAME TO "trading_bot_config"`);
        await queryRunner.query(`CREATE INDEX "IDX_1ea32e1069f3231dc7e686714d" ON "trading_bot_config" ("user_id") `);
        await queryRunner.query(`DROP INDEX "IDX_df3dbc2491e68eb07e6e6dd88e"`);
        await queryRunner.query(`DROP INDEX "IDX_a02101e5415f97dabb9318d7ed"`);
        await queryRunner.query(`DROP INDEX "IDX_e15f04a148cd2c321831651e1a"`);
        await queryRunner.query(`DROP INDEX "IDX_15af4b63be0b5c589c0badef20"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" text NOT NULL, "exchange" text NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit_on_grid" integer NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "state" integer NOT NULL DEFAULT (1), "user_id" integer NOT NULL, "credentials_id" integer, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "stopped_at" datetime, "stop_reason" varchar, "position" integer NOT NULL DEFAULT (1), "take_profit" real, CONSTRAINT "FK_df3dbc2491e68eb07e6e6dd88e6" FOREIGN KEY ("credentials_id") REFERENCES "exchange_credentials" ("id") ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT "FK_a02101e5415f97dabb9318d7eda" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot"("id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at", "stop_reason", "position", "take_profit") SELECT "id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at", "stop_reason", "position", "take_profit" FROM "trading_bot"`);
        await queryRunner.query(`DROP TABLE "trading_bot"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot" RENAME TO "trading_bot"`);
        await queryRunner.query(`CREATE INDEX "IDX_df3dbc2491e68eb07e6e6dd88e" ON "trading_bot" ("credentials_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a02101e5415f97dabb9318d7ed" ON "trading_bot" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e15f04a148cd2c321831651e1a" ON "trading_bot" ("exchange") `);
        await queryRunner.query(`CREATE INDEX "IDX_15af4b63be0b5c589c0badef20" ON "trading_bot" ("type") `);
        await queryRunner.query(`DROP INDEX "IDX_1ea32e1069f3231dc7e686714d"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit_on_grid" integer NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "user_id" integer NOT NULL, "take_profit" real, CONSTRAINT "FK_1ea32e1069f3231dc7e686714d2" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot_config"("id", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "user_id", "take_profit") SELECT "id", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "user_id", "take_profit" FROM "trading_bot_config"`);
        await queryRunner.query(`DROP TABLE "trading_bot_config"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot_config" RENAME TO "trading_bot_config"`);
        await queryRunner.query(`CREATE INDEX "IDX_1ea32e1069f3231dc7e686714d" ON "trading_bot_config" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f570bf2cf6dc75bddf9938961d" ON "trading_bot" ("state") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_f570bf2cf6dc75bddf9938961d"`);
        await queryRunner.query(`DROP INDEX "IDX_1ea32e1069f3231dc7e686714d"`);
        await queryRunner.query(`ALTER TABLE "trading_bot_config" RENAME TO "temporary_trading_bot_config"`);
        await queryRunner.query(`CREATE TABLE "trading_bot_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit_on_grid" real NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "user_id" integer NOT NULL, "take_profit" real, CONSTRAINT "FK_1ea32e1069f3231dc7e686714d2" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "trading_bot_config"("id", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "user_id", "take_profit") SELECT "id", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "user_id", "take_profit" FROM "temporary_trading_bot_config"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot_config"`);
        await queryRunner.query(`CREATE INDEX "IDX_1ea32e1069f3231dc7e686714d" ON "trading_bot_config" ("user_id") `);
        await queryRunner.query(`DROP INDEX "IDX_15af4b63be0b5c589c0badef20"`);
        await queryRunner.query(`DROP INDEX "IDX_e15f04a148cd2c321831651e1a"`);
        await queryRunner.query(`DROP INDEX "IDX_a02101e5415f97dabb9318d7ed"`);
        await queryRunner.query(`DROP INDEX "IDX_df3dbc2491e68eb07e6e6dd88e"`);
        await queryRunner.query(`ALTER TABLE "trading_bot" RENAME TO "temporary_trading_bot"`);
        await queryRunner.query(`CREATE TABLE "trading_bot" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" text NOT NULL, "exchange" text NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit_on_grid" real NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "state" integer NOT NULL DEFAULT (1), "user_id" integer NOT NULL, "credentials_id" integer, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "stopped_at" datetime, "stop_reason" varchar, "position" integer NOT NULL DEFAULT (1), "take_profit" real, CONSTRAINT "FK_df3dbc2491e68eb07e6e6dd88e6" FOREIGN KEY ("credentials_id") REFERENCES "exchange_credentials" ("id") ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT "FK_a02101e5415f97dabb9318d7eda" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "trading_bot"("id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at", "stop_reason", "position", "take_profit") SELECT "id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at", "stop_reason", "position", "take_profit" FROM "temporary_trading_bot"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot"`);
        await queryRunner.query(`CREATE INDEX "IDX_15af4b63be0b5c589c0badef20" ON "trading_bot" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_e15f04a148cd2c321831651e1a" ON "trading_bot" ("exchange") `);
        await queryRunner.query(`CREATE INDEX "IDX_a02101e5415f97dabb9318d7ed" ON "trading_bot" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_df3dbc2491e68eb07e6e6dd88e" ON "trading_bot" ("credentials_id") `);
        await queryRunner.query(`DROP INDEX "IDX_1ea32e1069f3231dc7e686714d"`);
        await queryRunner.query(`ALTER TABLE "trading_bot_config" RENAME TO "temporary_trading_bot_config"`);
        await queryRunner.query(`CREATE TABLE "trading_bot_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit_on_grid" real NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "FK_1ea32e1069f3231dc7e686714d2" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "trading_bot_config"("id", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "user_id") SELECT "id", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "user_id" FROM "temporary_trading_bot_config"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot_config"`);
        await queryRunner.query(`CREATE INDEX "IDX_1ea32e1069f3231dc7e686714d" ON "trading_bot_config" ("user_id") `);
        await queryRunner.query(`DROP INDEX "IDX_15af4b63be0b5c589c0badef20"`);
        await queryRunner.query(`DROP INDEX "IDX_e15f04a148cd2c321831651e1a"`);
        await queryRunner.query(`DROP INDEX "IDX_a02101e5415f97dabb9318d7ed"`);
        await queryRunner.query(`DROP INDEX "IDX_df3dbc2491e68eb07e6e6dd88e"`);
        await queryRunner.query(`ALTER TABLE "trading_bot" RENAME TO "temporary_trading_bot"`);
        await queryRunner.query(`CREATE TABLE "trading_bot" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" text NOT NULL, "exchange" text NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit_on_grid" real NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "state" integer NOT NULL DEFAULT (1), "user_id" integer NOT NULL, "credentials_id" integer, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "stopped_at" datetime, "stop_reason" varchar, "position" integer NOT NULL DEFAULT (1), CONSTRAINT "FK_df3dbc2491e68eb07e6e6dd88e6" FOREIGN KEY ("credentials_id") REFERENCES "exchange_credentials" ("id") ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT "FK_a02101e5415f97dabb9318d7eda" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "trading_bot"("id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at", "stop_reason", "position") SELECT "id", "type", "exchange", "base_currency", "quote_currency", "take_profit_on_grid", "grid_step", "grid_volume", "state", "user_id", "credentials_id", "created_at", "stopped_at", "stop_reason", "position" FROM "temporary_trading_bot"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot"`);
        await queryRunner.query(`CREATE INDEX "IDX_15af4b63be0b5c589c0badef20" ON "trading_bot" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_e15f04a148cd2c321831651e1a" ON "trading_bot" ("exchange") `);
        await queryRunner.query(`CREATE INDEX "IDX_a02101e5415f97dabb9318d7ed" ON "trading_bot" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_df3dbc2491e68eb07e6e6dd88e" ON "trading_bot" ("credentials_id") `);
    }

}
