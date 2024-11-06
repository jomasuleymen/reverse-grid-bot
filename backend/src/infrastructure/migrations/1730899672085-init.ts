import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1730899672085 implements MigrationInterface {
    name = 'Init1730899672085'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_4b8db7e631b6d70e1e5d273336"`);
        await queryRunner.query(`CREATE TABLE "temporary_trading_bot_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fee_currency" varchar NOT NULL, "custom_id" varchar NOT NULL, "avg_price" real NOT NULL, "quantity" real NOT NULL, "side" varchar CHECK( "side" IN ('buy','sell') ) NOT NULL, "fee" real NOT NULL, "symbol" varchar NOT NULL, "created_date" datetime NOT NULL, "bot_id" integer NOT NULL, "order_id" varchar NOT NULL, CONSTRAINT "FK_4b8db7e631b6d70e1e5d2733363" FOREIGN KEY ("bot_id") REFERENCES "trading_bot" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_trading_bot_orders"("id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id") SELECT "id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id" FROM "trading_bot_orders"`);
        await queryRunner.query(`DROP TABLE "trading_bot_orders"`);
        await queryRunner.query(`ALTER TABLE "temporary_trading_bot_orders" RENAME TO "trading_bot_orders"`);
        await queryRunner.query(`CREATE INDEX "IDX_4b8db7e631b6d70e1e5d273336" ON "trading_bot_orders" ("bot_id") `);
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
        await queryRunner.query(`DROP INDEX "IDX_4b8db7e631b6d70e1e5d273336"`);
        await queryRunner.query(`ALTER TABLE "trading_bot_orders" RENAME TO "temporary_trading_bot_orders"`);
        await queryRunner.query(`CREATE TABLE "trading_bot_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fee_currency" varchar NOT NULL, "custom_id" varchar NOT NULL, "avg_price" real NOT NULL, "quantity" real NOT NULL, "side" varchar CHECK( "side" IN ('buy','sell') ) NOT NULL, "fee" real NOT NULL, "symbol" varchar NOT NULL, "created_date" datetime NOT NULL, "bot_id" integer NOT NULL, CONSTRAINT "FK_4b8db7e631b6d70e1e5d2733363" FOREIGN KEY ("bot_id") REFERENCES "trading_bot" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "trading_bot_orders"("id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id") SELECT "id", "fee_currency", "custom_id", "avg_price", "quantity", "side", "fee", "symbol", "created_date", "bot_id" FROM "temporary_trading_bot_orders"`);
        await queryRunner.query(`DROP TABLE "temporary_trading_bot_orders"`);
        await queryRunner.query(`CREATE INDEX "IDX_4b8db7e631b6d70e1e5d273336" ON "trading_bot_orders" ("bot_id") `);
    }

}
