import { MigrationInterface, QueryRunner } from "typeorm";

export class Main1731840400654 implements MigrationInterface {
    name = 'Main1731840400654'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_1ea32e1069f3231dc7e686714d"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "FK_1ea32e1069f3231dc7e686714d2" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot_config"("id", "base_currency", "quote_currency", "grid_step", "grid_volume", "user_id") SELECT "id", "base_currency", "quote_currency", "grid_step", "grid_volume", "user_id" FROM "trading_bot_config"`);
        await queryRunner.query(`DROP TABLE "trading_bot_config"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot_config" RENAME TO "trading_bot_config"`);
        await queryRunner.query(`CREATE INDEX "IDX_1ea32e1069f3231dc7e686714d" ON "trading_bot_config" ("user_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_1ea32e1069f3231dc7e686714d"`);
        await queryRunner.query(`ALTER TABLE "trading_bot_config" RENAME TO "temporary_trading_bot_config"`);
        await queryRunner.query(`CREATE TABLE "trading_bot_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "base_currency" varchar NOT NULL, "quote_currency" varchar NOT NULL, "take_profit_on_grid" integer NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "FK_1ea32e1069f3231dc7e686714d2" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "trading_bot_config"("id", "base_currency", "quote_currency", "grid_step", "grid_volume", "user_id") SELECT "id", "base_currency", "quote_currency", "grid_step", "grid_volume", "user_id" FROM "temporary_trading_bot_config"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot_config"`);
        await queryRunner.query(`CREATE INDEX "IDX_1ea32e1069f3231dc7e686714d" ON "trading_bot_config" ("user_id") `);
    }

}
