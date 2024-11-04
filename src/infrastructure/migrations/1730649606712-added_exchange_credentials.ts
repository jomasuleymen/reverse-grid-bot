import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedExchangeCredentials1730649606712 implements MigrationInterface {
    name = 'AddedExchangeCredentials1730649606712'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "exchange_account" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "mode" integer NOT NULL DEFAULT (1), "api_key" varchar NOT NULL, "api_secret" varchar NOT NULL, "exchange" text NOT NULL, "user_id" integer NOT NULL)`);
        await queryRunner.query(`CREATE INDEX "IDX_59e056f48407c85b00ad297111" ON "exchange_account" ("mode") `);
        await queryRunner.query(`CREATE INDEX "IDX_355cf7a3ba3d0fbba156f15f8a" ON "exchange_account" ("exchange") `);
        await queryRunner.query(`CREATE INDEX "IDX_967dea913a28a7e58dc2d597b8" ON "exchange_account" ("user_id") `);
        await queryRunner.query(`DROP INDEX "IDX_1ea32e1069f3231dc7e686714d"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "take_profit" real, "grid_step" real, "grid_volume" real, "symbol" varchar, "user_id" integer NOT NULL, CONSTRAINT "REL_1ea32e1069f3231dc7e686714d" UNIQUE ("user_id"), CONSTRAINT "FK_1ea32e1069f3231dc7e686714d2" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot_config"("id", "take_profit", "grid_step", "grid_volume", "symbol", "user_id") SELECT "id", "take_profit", "grid_step", "grid_volume", "symbol", "user_id" FROM "trading_bot_config"`);
        await queryRunner.query(`DROP TABLE "trading_bot_config"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot_config" RENAME TO "trading_bot_config"`);
        await queryRunner.query(`CREATE INDEX "IDX_1ea32e1069f3231dc7e686714d" ON "trading_bot_config" ("user_id") `);
        await queryRunner.query(`DROP INDEX "IDX_59e056f48407c85b00ad297111"`);
        await queryRunner.query(`DROP INDEX "IDX_355cf7a3ba3d0fbba156f15f8a"`);
        await queryRunner.query(`DROP INDEX "IDX_967dea913a28a7e58dc2d597b8"`);
        await queryRunner.query(`CREATE TABLE "temporary_exchange_account" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "mode" integer NOT NULL DEFAULT (1), "api_key" varchar NOT NULL, "api_secret" varchar NOT NULL, "exchange" text NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "FK_967dea913a28a7e58dc2d597b82" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_exchange_account"("id", "mode", "api_key", "api_secret", "exchange", "user_id") SELECT "id", "mode", "api_key", "api_secret", "exchange", "user_id" FROM "exchange_account"`);
        await queryRunner.query(`DROP TABLE "exchange_account"`);
        await queryRunner.query(`ALTER TABLE "temporary_exchange_account" RENAME TO "exchange_account"`);
        await queryRunner.query(`CREATE INDEX "IDX_59e056f48407c85b00ad297111" ON "exchange_account" ("mode") `);
        await queryRunner.query(`CREATE INDEX "IDX_355cf7a3ba3d0fbba156f15f8a" ON "exchange_account" ("exchange") `);
        await queryRunner.query(`CREATE INDEX "IDX_967dea913a28a7e58dc2d597b8" ON "exchange_account" ("user_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_967dea913a28a7e58dc2d597b8"`);
        await queryRunner.query(`DROP INDEX "IDX_355cf7a3ba3d0fbba156f15f8a"`);
        await queryRunner.query(`DROP INDEX "IDX_59e056f48407c85b00ad297111"`);
        await queryRunner.query(`ALTER TABLE "exchange_account" RENAME TO "temporary_exchange_account"`);
        await queryRunner.query(`CREATE TABLE "exchange_account" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "mode" integer NOT NULL DEFAULT (1), "api_key" varchar NOT NULL, "api_secret" varchar NOT NULL, "exchange" text NOT NULL, "user_id" integer NOT NULL)`);
        await queryRunner.query(`INSERT INTO "exchange_account"("id", "mode", "api_key", "api_secret", "exchange", "user_id") SELECT "id", "mode", "api_key", "api_secret", "exchange", "user_id" FROM "temporary_exchange_account"`);
        await queryRunner.query(`DROP TABLE "temporary_exchange_account"`);
        await queryRunner.query(`CREATE INDEX "IDX_967dea913a28a7e58dc2d597b8" ON "exchange_account" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_355cf7a3ba3d0fbba156f15f8a" ON "exchange_account" ("exchange") `);
        await queryRunner.query(`CREATE INDEX "IDX_59e056f48407c85b00ad297111" ON "exchange_account" ("mode") `);
        await queryRunner.query(`DROP INDEX "IDX_1ea32e1069f3231dc7e686714d"`);
        await queryRunner.query(`ALTER TABLE "trading_bot_config" RENAME TO "temporary_trading_bot_config"`);
        await queryRunner.query(`CREATE TABLE "trading_bot_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "take_profit" real, "grid_step" real, "grid_volume" real, "account_mode" integer NOT NULL DEFAULT (1), "symbol" varchar, "user_id" integer NOT NULL, CONSTRAINT "REL_1ea32e1069f3231dc7e686714d" UNIQUE ("user_id"), CONSTRAINT "FK_1ea32e1069f3231dc7e686714d2" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "trading_bot_config"("id", "take_profit", "grid_step", "grid_volume", "symbol", "user_id") SELECT "id", "take_profit", "grid_step", "grid_volume", "symbol", "user_id" FROM "temporary_trading_bot_config"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot_config"`);
        await queryRunner.query(`CREATE INDEX "IDX_1ea32e1069f3231dc7e686714d" ON "trading_bot_config" ("user_id") `);
        await queryRunner.query(`DROP INDEX "IDX_967dea913a28a7e58dc2d597b8"`);
        await queryRunner.query(`DROP INDEX "IDX_355cf7a3ba3d0fbba156f15f8a"`);
        await queryRunner.query(`DROP INDEX "IDX_59e056f48407c85b00ad297111"`);
        await queryRunner.query(`DROP TABLE "exchange_account"`);
    }

}
