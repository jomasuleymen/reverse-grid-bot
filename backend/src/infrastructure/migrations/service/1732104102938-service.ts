import { MigrationInterface, QueryRunner } from "typeorm";

export class Service1732104102938 implements MigrationInterface {
    name = 'Service1732104102938'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "trading_bot_simulator_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fee_currency" varchar NOT NULL, "avg_price" real NOT NULL, "trigger_price" real, "quantity" real NOT NULL, "side" text NOT NULL, "fee" real NOT NULL, "created_date" datetime NOT NULL, "bot_id" integer NOT NULL)`);
        await queryRunner.query(`CREATE INDEX "IDX_9f7ee5c3bcc0380d319f21322e" ON "trading_bot_simulator_orders" ("bot_id") `);
        await queryRunner.query(`CREATE TABLE "trading_bot_simulator_stats" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "open_price" real NOT NULL, "highest_price" real NOT NULL, "lowest_price" real NOT NULL, "close_price" real NOT NULL, "bot_id" integer NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "REL_e3b754fd39a4a5b9b5409c2220" UNIQUE ("bot_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e3b754fd39a4a5b9b5409c2220" ON "trading_bot_simulator_stats" ("bot_id") `);
        await queryRunner.query(`CREATE TABLE "trading_bot_simulator" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "base_currency" text NOT NULL, "quote_currency" text NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "position" integer NOT NULL DEFAULT (1), "start_time" integer NOT NULL, "end_time" integer NOT NULL, "status" integer NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "kline" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "symbol" varchar NOT NULL, "open_time" bigint NOT NULL, "open" decimal(18,8) NOT NULL, "high" decimal(18,8) NOT NULL, "low" decimal(18,8) NOT NULL, "close" decimal(18,8) NOT NULL, "volume" decimal(18,8) NOT NULL, "close_time" bigint NOT NULL, "quote_asset_volume" decimal(18,8) NOT NULL, "number_of_trades" integer NOT NULL, "taker_buy_base_asset_volume" decimal(18,8) NOT NULL, "taker_buy_quote_asset_volume" decimal(18,8) NOT NULL, CONSTRAINT "UQ_b41afde78b412eaae119f61efce" UNIQUE ("symbol", "open_time"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b943ad40580870e10d36841641" ON "kline" ("open_time") `);
        await queryRunner.query(`CREATE INDEX "IDX_f4d60ab36d1748372d474184c0" ON "kline" ("close_time") `);
        await queryRunner.query(`DROP INDEX "IDX_9f7ee5c3bcc0380d319f21322e"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot_simulator_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fee_currency" varchar NOT NULL, "avg_price" real NOT NULL, "trigger_price" real, "quantity" real NOT NULL, "side" text NOT NULL, "fee" real NOT NULL, "created_date" datetime NOT NULL, "bot_id" integer NOT NULL, CONSTRAINT "FK_9f7ee5c3bcc0380d319f21322ea" FOREIGN KEY ("bot_id") REFERENCES "trading_bot_simulator" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot_simulator_orders"("id", "fee_currency", "avg_price", "trigger_price", "quantity", "side", "fee", "created_date", "bot_id") SELECT "id", "fee_currency", "avg_price", "trigger_price", "quantity", "side", "fee", "created_date", "bot_id" FROM "trading_bot_simulator_orders"`);
        await queryRunner.query(`DROP TABLE "trading_bot_simulator_orders"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot_simulator_orders" RENAME TO "trading_bot_simulator_orders"`);
        await queryRunner.query(`CREATE INDEX "IDX_9f7ee5c3bcc0380d319f21322e" ON "trading_bot_simulator_orders" ("bot_id") `);
        await queryRunner.query(`DROP INDEX "IDX_e3b754fd39a4a5b9b5409c2220"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot_simulator_stats" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "open_price" real NOT NULL, "highest_price" real NOT NULL, "lowest_price" real NOT NULL, "close_price" real NOT NULL, "bot_id" integer NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "REL_e3b754fd39a4a5b9b5409c2220" UNIQUE ("bot_id"), CONSTRAINT "FK_e3b754fd39a4a5b9b5409c22209" FOREIGN KEY ("bot_id") REFERENCES "trading_bot_simulator" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot_simulator_stats"("id", "open_price", "highest_price", "lowest_price", "close_price", "bot_id", "created_at") SELECT "id", "open_price", "highest_price", "lowest_price", "close_price", "bot_id", "created_at" FROM "trading_bot_simulator_stats"`);
        await queryRunner.query(`DROP TABLE "trading_bot_simulator_stats"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot_simulator_stats" RENAME TO "trading_bot_simulator_stats"`);
        await queryRunner.query(`CREATE INDEX "IDX_e3b754fd39a4a5b9b5409c2220" ON "trading_bot_simulator_stats" ("bot_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_e3b754fd39a4a5b9b5409c2220"`);
        await queryRunner.query(`ALTER TABLE "trading_bot_simulator_stats" RENAME TO "temporary_trading_bot_simulator_stats"`);
        await queryRunner.query(`CREATE TABLE "trading_bot_simulator_stats" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "open_price" real NOT NULL, "highest_price" real NOT NULL, "lowest_price" real NOT NULL, "close_price" real NOT NULL, "bot_id" integer NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "REL_e3b754fd39a4a5b9b5409c2220" UNIQUE ("bot_id"))`);
        await queryRunner.query(`INSERT INTO "trading_bot_simulator_stats"("id", "open_price", "highest_price", "lowest_price", "close_price", "bot_id", "created_at") SELECT "id", "open_price", "highest_price", "lowest_price", "close_price", "bot_id", "created_at" FROM "temporary_trading_bot_simulator_stats"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot_simulator_stats"`);
        await queryRunner.query(`CREATE INDEX "IDX_e3b754fd39a4a5b9b5409c2220" ON "trading_bot_simulator_stats" ("bot_id") `);
        await queryRunner.query(`DROP INDEX "IDX_9f7ee5c3bcc0380d319f21322e"`);
        await queryRunner.query(`ALTER TABLE "trading_bot_simulator_orders" RENAME TO "temporary_trading_bot_simulator_orders"`);
        await queryRunner.query(`CREATE TABLE "trading_bot_simulator_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fee_currency" varchar NOT NULL, "avg_price" real NOT NULL, "trigger_price" real, "quantity" real NOT NULL, "side" text NOT NULL, "fee" real NOT NULL, "created_date" datetime NOT NULL, "bot_id" integer NOT NULL)`);
        await queryRunner.query(`INSERT INTO "trading_bot_simulator_orders"("id", "fee_currency", "avg_price", "trigger_price", "quantity", "side", "fee", "created_date", "bot_id") SELECT "id", "fee_currency", "avg_price", "trigger_price", "quantity", "side", "fee", "created_date", "bot_id" FROM "temporary_trading_bot_simulator_orders"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot_simulator_orders"`);
        await queryRunner.query(`CREATE INDEX "IDX_9f7ee5c3bcc0380d319f21322e" ON "trading_bot_simulator_orders" ("bot_id") `);
        await queryRunner.query(`DROP INDEX "IDX_f4d60ab36d1748372d474184c0"`);
        await queryRunner.query(`DROP INDEX "IDX_b943ad40580870e10d36841641"`);
        await queryRunner.query(`DROP TABLE "kline"`);
        await queryRunner.query(`DROP TABLE "trading_bot_simulator"`);
        await queryRunner.query(`DROP INDEX "IDX_e3b754fd39a4a5b9b5409c2220"`);
        await queryRunner.query(`DROP TABLE "trading_bot_simulator_stats"`);
        await queryRunner.query(`DROP INDEX "IDX_9f7ee5c3bcc0380d319f21322e"`);
        await queryRunner.query(`DROP TABLE "trading_bot_simulator_orders"`);
    }

}
