import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1730223373575 implements MigrationInterface {
    name = 'Init1730223373575'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "telegram_user_id" integer NOT NULL, "chat_id" integer NOT NULL, "first_name" varchar, "username" varchar, CONSTRAINT "UQ_f1921ddb8658d793ef7a901e781" UNIQUE ("telegram_user_id"), CONSTRAINT "UQ_c43d9c7669f5c12f23686e1b891" UNIQUE ("chat_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f1921ddb8658d793ef7a901e78" ON "user" ("telegram_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c43d9c7669f5c12f23686e1b89" ON "user" ("chat_id") `);
        await queryRunner.query(`CREATE TABLE "trading_bot_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "close_at_price" integer, "user_id" integer NOT NULL, CONSTRAINT "REL_1ea32e1069f3231dc7e686714d" UNIQUE ("user_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1ea32e1069f3231dc7e686714d" ON "trading_bot_config" ("user_id") `);
        await queryRunner.query(`DROP INDEX "IDX_1ea32e1069f3231dc7e686714d"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "close_at_price" integer, "user_id" integer NOT NULL, CONSTRAINT "REL_1ea32e1069f3231dc7e686714d" UNIQUE ("user_id"), CONSTRAINT "FK_1ea32e1069f3231dc7e686714d2" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot_config"("id", "close_at_price", "user_id") SELECT "id", "close_at_price", "user_id" FROM "trading_bot_config"`);
        await queryRunner.query(`DROP TABLE "trading_bot_config"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot_config" RENAME TO "trading_bot_config"`);
        await queryRunner.query(`CREATE INDEX "IDX_1ea32e1069f3231dc7e686714d" ON "trading_bot_config" ("user_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_1ea32e1069f3231dc7e686714d"`);
        await queryRunner.query(`ALTER TABLE "trading_bot_config" RENAME TO "temporary_trading_bot_config"`);
        await queryRunner.query(`CREATE TABLE "trading_bot_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "close_at_price" integer, "user_id" integer NOT NULL, CONSTRAINT "REL_1ea32e1069f3231dc7e686714d" UNIQUE ("user_id"))`);
        await queryRunner.query(`INSERT INTO "trading_bot_config"("id", "close_at_price", "user_id") SELECT "id", "close_at_price", "user_id" FROM "temporary_trading_bot_config"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot_config"`);
        await queryRunner.query(`CREATE INDEX "IDX_1ea32e1069f3231dc7e686714d" ON "trading_bot_config" ("user_id") `);
        await queryRunner.query(`DROP INDEX "IDX_1ea32e1069f3231dc7e686714d"`);
        await queryRunner.query(`DROP TABLE "trading_bot_config"`);
        await queryRunner.query(`DROP INDEX "IDX_c43d9c7669f5c12f23686e1b89"`);
        await queryRunner.query(`DROP INDEX "IDX_f1921ddb8658d793ef7a901e78"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
